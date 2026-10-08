import { createHash } from "node:crypto";
import { CATEGORIES } from "@/lib/categories";

/**
 * O que o Astra manda, e o que aceitamos.
 *
 * As mensagens de recusa são escritas PARA UM MODELO LER. O Actions do GPT
 * mostra o corpo da resposta de volta ao agente: "categoria inválida" faz ele
 * reenviar o mesmo payload até estourar a cota; "use uma de: mercado,
 * regulacao, …" faz ele se corrigir sozinho na tentativa seguinte.
 */

/**
 * A lista sai de `CATEGORIES`, e um teste amarra as duas.
 *
 * Sem isso, esta seria a quinta fonte de verdade sobre editorias — banco,
 * `categories.ts`, contrato, prompt do Astra e esquema OpenAPI — e a primeira
 * a divergir em silêncio.
 */
export const CATEGORIAS_ACEITAS: readonly string[] = CATEGORIES.map((c) => c.slug);

/** Teto do texto cru, antes de gastar CPU interpretando. */
export const LIMITE_DE_MARKDOWN = 80_000;

export interface PedidoDeIngestao {
  titulo: string;
  categoria: string;
  corpoMarkdown: string;
  linhaDeApoio: string | null;
  resumo: string | null;
  seoTitulo: string | null;
  seoDescricao: string | null;
  /** De onde veio a matéria. Nulo é o caminho manual e o do agente externo. */
  origem: "release" | "primaria" | "derivada" | null;
  fonteOriginalUrl: string | null;
  fonteOriginalNome: string | null;
  /** A pauta que originou a matéria, para marcá-la como usada. */
  pautaId: string | null;
  /** Endereço http(s) ou caminho do próprio site (começa com uma barra). */
  capaUrl: string | null;
}

const ORIGENS: readonly string[] = ["release", "primaria", "derivada"];

export type Validacao =
  | { ok: true; pedido: PedidoDeIngestao }
  | { ok: false; erro: string; comoCorrigir: string };

const recusar = (erro: string, comoCorrigir: string): Validacao => ({
  ok: false,
  erro,
  comoCorrigir,
});

/** Texto opcional: em branco vira nulo, nunca string vazia no banco. */
function opcional(valor: unknown): string | null {
  const t = typeof valor === "string" ? valor.trim() : "";
  return t || null;
}

/**
 * Caminho começando com uma barra, que não escapa para outro host nem sobe
 * de diretório. O navegador trata `\` como `/`, então `/\evil.com` vira
 * `//evil.com`; `..` pode vir codificado (`%2e%2e`).
 */
function caminhoLocalSeguro(caminho: string): boolean {
  if (!caminho.startsWith("/") || caminho.startsWith("//")) return false;
  if (caminho.includes("\\")) return false;
  let decodificado: string;
  try {
    decodificado = decodeURIComponent(caminho);
  } catch {
    return false;
  }
  if (decodificado.includes("\\") || decodificado.startsWith("//")) return false;
  return !decodificado.split("/").some((s) => s === "..");
}

/** O que a rota grava em `articles` a partir da procedência do pedido. */
export function camposDaProcedencia(pedido: PedidoDeIngestao) {
  return {
    origem: pedido.origem,
    fonte_original_url: pedido.fonteOriginalUrl,
    fonte_original_nome: pedido.fonteOriginalNome,
    // Derivada nasce marcada: saiu de cobertura de terceiro sem que a fonte
    // primária fosse encontrada, e ninguém conferiu ainda.
    precisa_checagem: pedido.origem === "derivada",
    cover_url: pedido.capaUrl,
  };
}

export function validarPedido(corpo: unknown): Validacao {
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
    return recusar(
      "O corpo da requisição não é um objeto JSON.",
      'Envie JSON com os campos: titulo, categoria, corpoMarkdown.'
    );
  }

  const c = corpo as Record<string, unknown>;

  // Modelo adora deixar quebra de linha no fim do título.
  const titulo = typeof c.titulo === "string" ? c.titulo.trim() : "";
  if (titulo.length < 3) {
    return recusar(
      "Título ausente ou curto demais.",
      "Envie `titulo` com pelo menos três caracteres."
    );
  }

  const categoria = typeof c.categoria === "string" ? c.categoria.trim().toLowerCase() : "";
  if (!CATEGORIAS_ACEITAS.includes(categoria)) {
    return recusar(
      `Categoria "${categoria || "(vazia)"}" não existe no portal.`,
      `Use uma destas em \`categoria\`: ${CATEGORIAS_ACEITAS.join(", ")}.`
    );
  }

  const corpoMarkdown = typeof c.corpoMarkdown === "string" ? c.corpoMarkdown : "";
  if (!corpoMarkdown.trim()) {
    return recusar(
      "O corpo da matéria veio vazio.",
      "Envie o texto em `corpoMarkdown`, em Markdown."
    );
  }
  if (corpoMarkdown.length > LIMITE_DE_MARKDOWN) {
    return recusar(
      `O texto tem ${corpoMarkdown.length} caracteres e o limite é ${LIMITE_DE_MARKDOWN}.`,
      "Deixe a matéria mais curta, ou divida em mais de uma."
    );
  }

  // Campo presente com tipo errado é recusado, nunca tratado como ausente:
  // `origem: 1` viraria matéria sem origem e sem marca de checagem.
  for (const campo of ["origem", "fonteOriginalUrl", "fonteOriginalNome", "capaUrl", "pautaId"]) {
    const v = c[campo];
    if (v !== undefined && v !== null && typeof v !== "string") {
      return recusar(
        `O campo \`${campo}\` veio com tipo errado.`,
        `Envie \`${campo}\` como texto (string), ou omita o campo.`
      );
    }
  }

  const origem = typeof c.origem === "string" ? c.origem.trim() : "";
  if (origem && !ORIGENS.includes(origem)) {
    return recusar(
      `Origem "${origem}" não existe.`,
      `Use uma destas em \`origem\`: ${ORIGENS.join(", ")} — ou omita o campo.`
    );
  }

  const fonteUrl = typeof c.fonteOriginalUrl === "string" ? c.fonteOriginalUrl.trim() : "";
  if (fonteUrl && !/^https?:\/\//i.test(fonteUrl)) {
    return recusar(
      "O endereço de origem precisa começar com http:// ou https://.",
      "Envie `fonteOriginalUrl` como endereço completo."
    );
  }

  // A mesma regra que a check constraint do banco impõe — mas aqui ela devolve
  // uma mensagem que o agente consegue ler e corrigir, em vez de um 500 cru.
  if (origem === "derivada" && !fonteUrl) {
    return recusar(
      "Matéria derivada precisa dizer de onde veio.",
      "Envie `fonteOriginalUrl` com o endereço da cobertura de origem, ou use outra `origem`."
    );
  }

  // Só caminho do projeto (`/capas/mercado.jpg`). O portal só otimiza imagem
  // do próprio armazenamento; um host qualquer gravaria e quebraria na página
  // enquanto o remetente recebe 201.
  const capaUrl = typeof c.capaUrl === "string" ? c.capaUrl.trim() : "";
  if (capaUrl && !caminhoLocalSeguro(capaUrl)) {
    return recusar(
      "A capa precisa ser um caminho do projeto, como /capas/mercado.jpg.",
      "Envie `capaUrl` como caminho do projeto: começa com uma barra, sem esquema (http, https), sem `\\` e sem `..`. Imagem hospedada fora entra pelo upload do painel."
    );
  }

  return {
    ok: true,
    pedido: {
      titulo,
      categoria,
      corpoMarkdown,
      linhaDeApoio: opcional(c.linhaDeApoio),
      resumo: opcional(c.resumo),
      seoTitulo: opcional(c.seoTitulo),
      seoDescricao: opcional(c.seoDescricao),
      origem: (origem || null) as PedidoDeIngestao["origem"],
      fonteOriginalUrl: fonteUrl || null,
      fonteOriginalNome: opcional(c.fonteOriginalNome),
      pautaId: opcional(c.pautaId),
      capaUrl: capaUrl || null,
    },
  };
}

/**
 * A chave que diz se já recebemos isto.
 *
 * É hash do CONTEÚDO, não do endereço. O caminho do slug estaria errado nas
 * duas direções: coluna diária repete título por natureza — `endereco.ts`
 * existe justamente por causa disso —, e o slug ainda é recalculado a cada
 * gravação enquanto a matéria não foi publicada, então ele se move durante a
 * revisão.
 *
 * Com o conteúdo na chave, reenvio idêntico é duplicata (e respondemos com a
 * matéria que já existe), enquanto reenvio CORRIGIDO é matéria nova — que é o
 * que precisa acontecer, porque responder "sucesso" a uma correção
 * descartada é o pior modo de falha possível num veículo de notícia.
 */
export function chaveDeConteudo(titulo: string, corpoMarkdown: string): string {
  return createHash("sha256")
    .update(`${titulo.trim()}\n\u0000\n${corpoMarkdown.trim()}`, "utf8")
    .digest("hex");
}
