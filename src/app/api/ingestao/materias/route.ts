import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { chaveDeConteudo, validarPedido } from "@/lib/ingestao/contrato";
import { converterMarkdown } from "@/lib/ingestao/markdown";
import { enderecoDisponivel } from "@/lib/painel/endereco";
import { slugDeNome } from "@/lib/auth/rules";
import { extrairTexto, tempoDeLeitura } from "@/lib/editor/document";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Porta de entrada para o agente externo que redige matérias.
 *
 * A matéria SEMPRE entra em revisão. Nada publica sozinho — é a única coisa
 * que o dono do veículo pediu, e é a que o resto do desenho protege.
 *
 * Primeira superfície de API real do projeto. Todo o peso mora em módulos
 * puros (`lib/ingestao/`), porque Route Handler não é testável nesta suíte —
 * mesmo padrão de `session.ts` e `upload.ts`. Esta casca é fina de propósito.
 */

/** Teto do corpo cru, antes de ler. */
const LIMITE_DE_BYTES = 256 * 1024;

/** Quantas matérias o agente pode mandar por hora. */
const COTA_POR_HORA = 20;

const SLUG_DA_REDACAO = "da-redacao";
const NOME_DA_REDACAO = "Da Redação";

type Resposta = { erro: string; comoCorrigir: string };

const recusa = (status: number, erro: string, comoCorrigir: string) =>
  NextResponse.json<Resposta>({ erro, comoCorrigir }, { status });

/**
 * Compara segredos sem vazar o comprimento.
 *
 * `timingSafeEqual` LANÇA com buffers de tamanhos diferentes — sondar com um
 * token de um caractere devolveria 500 em vez de 401, e a diferença de
 * resposta já entrega o tamanho do segredo. O atalho que todo mundo escreve
 * (`if (a.length !== b.length) return false`) reintroduz o vazamento que a
 * comparação constante existe para fechar. Hash dos dois lados resolve: os
 * digests têm sempre 32 bytes.
 */
function segredoConfere(recebido: string, guardado: string): boolean {
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(guardado).digest();
  return timingSafeEqual(a, b);
}

/** Os tokens válidos. Dois para permitir rotação sem apagão no agente. */
function tokensDoServidor(): string[] {
  return [process.env.INGESTAO_TOKEN, process.env.INGESTAO_TOKEN_ANTERIOR]
    .map((t) => t?.trim() ?? "")
    .filter((t) => t.length >= 32);
}

export async function POST(request: NextRequest) {
  // ── 1. Autenticação ─────────────────────────────────────────────────────
  const tokens = tokensDoServidor();
  if (tokens.length === 0) {
    // 503 e não 401: "não configurado" e "chave errada" são problemas
    // diferentes, e quem lê isto precisa saber qual dos dois é.
    return recusa(
      503,
      "A ingestão não está configurada neste ambiente.",
      "Defina INGESTAO_TOKEN (32 caracteres ou mais) nas variáveis do servidor."
    );
  }

  const cabecalho = request.headers.get("authorization") ?? "";
  const recebido = cabecalho.replace(/^Bearer\s+/i, "").trim();
  if (!recebido || !tokens.some((t) => segredoConfere(recebido, t))) {
    return recusa(
      401,
      "Chave de acesso inválida.",
      "Envie o cabeçalho Authorization: Bearer <chave>."
    );
  }

  // ── 2. Tamanho, antes de ler ────────────────────────────────────────────
  const tamanho = Number(request.headers.get("content-length") ?? 0);
  if (tamanho > LIMITE_DE_BYTES) {
    return recusa(
      413,
      `O corpo tem ${tamanho} bytes e o limite é ${LIMITE_DE_BYTES}.`,
      "Mande uma matéria mais curta."
    );
  }

  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return recusa(400, "O corpo não é JSON válido.", "Envie JSON com Content-Type: application/json.");
  }

  // ── 3. Contrato e conversão ─────────────────────────────────────────────
  const validacao = validarPedido(bruto);
  if (!validacao.ok) return recusa(400, validacao.erro, validacao.comoCorrigir);
  const pedido = validacao.pedido;

  const conversao = converterMarkdown(pedido.corpoMarkdown);
  if (!conversao.ok) return recusa(422, conversao.erro, conversao.comoCorrigir);
  const doc = conversao.doc;

  const admin = criarClienteAdmin();

  // ── 4. A tabela de ingestão existe? ─────────────────────────────────────
  const hash = chaveDeConteudo(pedido.titulo, pedido.corpoMarkdown);
  const { data: jaRecebida, error: erroRegistro } = await admin
    .from("ingestao_recebidas")
    .select("article_id")
    .eq("hash_conteudo", hash)
    .maybeSingle();

  if (erroRegistro) {
    // O PostgREST não devolve o `42P01` do Postgres para tabela ausente: ele
    // responde `PGRST205` com "Could not find the table … in the schema
    // cache". Conferido contra o banco real — a primeira versão desta
    // checagem procurava `42P01` e deixava passar um 500 genérico, que é
    // exatamente a mensagem inútil que este ramo existe para evitar.
    const faltaTabela =
      erroRegistro.code === "PGRST205" ||
      erroRegistro.code === "42P01" ||
      /schema cache|does not exist/i.test(erroRegistro.message);
    return faltaTabela
      ? recusa(
          503,
          "A ingestão ainda não foi instalada no banco.",
          "Aplique a migração supabase/migrations/20260929000002_ingestao.sql no Supabase."
        )
      : recusa(500, `Falha ao consultar o histórico: ${erroRegistro.message}`, "Tente de novo em instantes.");
  }

  // Reenvio idêntico: devolve a mesma matéria. Isto é verdade, ao contrário
  // de responder sucesso e descartar um payload corrigido.
  if (jaRecebida?.article_id) {
    return NextResponse.json(
      { id: jaRecebida.article_id, estado: "ja_recebida", url: `/admin/materias/${jaRecebida.article_id}` },
      { status: 200 }
    );
  }

  // ── 5. Cota por hora ────────────────────────────────────────────────────
  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("ingestao_recebidas")
    .select("id", { count: "exact", head: true })
    .gte("recebido_em", umaHoraAtras);

  if ((count ?? 0) >= COTA_POR_HORA) {
    return recusa(
      429,
      `Limite de ${COTA_POR_HORA} matérias por hora atingido.`,
      "Espere e tente de novo mais tarde."
    );
  }

  // ── 6. Categoria e autor ────────────────────────────────────────────────
  const { data: categoria } = await admin
    .from("categories")
    .select("id")
    .eq("key", pedido.categoria)
    .maybeSingle();

  if (!categoria) {
    // A validação já conferiu contra `CATEGORIES`; chegar aqui significa que
    // o banco e o módulo divergiram. Erro legível, não `category_id: null`
    // silencioso que viraria "escolha uma categoria" na hora de publicar.
    return recusa(
      500,
      `A editoria "${pedido.categoria}" existe no portal mas não no banco.`,
      "Avise quem administra: as editorias estão fora de sincronia."
    );
  }

  const autorId = await resolverRedacao(admin);
  if (!autorId) {
    return recusa(500, "Não foi possível resolver a assinatura da redação.", "Avise quem administra.");
  }

  // ── 7. Gravação ─────────────────────────────────────────────────────────
  const { data: vizinhos } = await admin
    .from("articles")
    .select("slug")
    .like("slug", `${slugDeNome(pedido.titulo) || "materia"}%`);

  const slug = enderecoDisponivel(pedido.titulo, (vizinhos ?? []).map((v) => v.slug));

  const { data: criada, error: erroInsert } = await admin
    .from("articles")
    .insert({
      slug,
      title: pedido.titulo,
      standfirst: pedido.linhaDeApoio,
      excerpt: pedido.resumo,
      seo_title: pedido.seoTitulo,
      seo_description: pedido.seoDescricao,
      category_id: categoria.id,
      author_id: autorId,
      // Sempre. A aprovação é do dono do veículo, e a fila de revisão é o
      // primeiro bloco do painel.
      status: "in_review",
      content_json: doc as never,
      content_text: extrairTexto(doc),
      reading_time: tempoDeLeitura(doc),
      // Deixado nulo de propósito: é o sinal de "nenhuma pessoa tocou nisto
      // ainda", e ele se limpa sozinho no primeiro salvamento humano. NÃO é
      // procedência — essa mora em `ingestao_recebidas`, onde não se apaga.
      updated_by: null,
    })
    .select("id")
    .single();

  if (erroInsert || !criada) {
    return recusa(
      500,
      `Não foi possível criar a matéria: ${erroInsert?.message ?? "erro desconhecido"}`,
      "Tente de novo em instantes."
    );
  }

  // O registro vem DEPOIS da matéria: se ele falhar, a matéria existe e será
  // revisada — perder o histórico é menos grave do que perder o texto. Um
  // reenvio criaria duplicata, que a pessoa vê e descarta.
  const { error: erroHistorico } = await admin
    .from("ingestao_recebidas")
    .insert({ article_id: criada.id, hash_conteudo: hash, titulo: pedido.titulo });

  if (erroHistorico) {
    console.error("[ingestao] histórico não gravado:", erroHistorico.message);
  }

  console.info(`[ingestao] matéria ${criada.id} recebida: ${pedido.titulo}`);

  return NextResponse.json(
    { id: criada.id, estado: "em_revisao", url: `/admin/materias/${criada.id}` },
    { status: 201 }
  );
}

/**
 * A assinatura da casa, criada se faltar.
 *
 * Criar a linha é insert, não DDL — então a ingestão não depende de nenhum
 * passo manual para ter onde assinar.
 */
async function resolverRedacao(
  admin: ReturnType<typeof criarClienteAdmin>
): Promise<string | null> {
  const { data: existente } = await admin
    .from("authors")
    .select("id")
    .eq("slug", SLUG_DA_REDACAO)
    .maybeSingle();

  if (existente) return existente.id;

  const { data: criado } = await admin
    .from("authors")
    .insert({ name: NOME_DA_REDACAO, slug: SLUG_DA_REDACAO, role: "Equipe editorial" })
    .select("id")
    .single();

  return criado?.id ?? null;
}
