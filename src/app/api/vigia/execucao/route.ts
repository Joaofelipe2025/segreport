import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { validarAchados } from "@/lib/vigia/pauta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Recebe uma execução inteira do vigia.
 *
 * UMA CHAMADA POR EXECUÇÃO, não uma por item. A linha de `vigia_execucoes`
 * é gravada junto com os achados, então não existe execução sem registro — e
 * execução sem achado nenhum ainda assim grava, que é exatamente o caso que
 * distingue "dia calmo" de "os três feeds quebraram".
 */
const LIMITE_DE_BYTES = 512 * 1024;

const recusa = (status: number, erro: string, comoCorrigir: string) =>
  NextResponse.json({ erro, comoCorrigir }, { status });

/** sha256 dos dois lados: `timingSafeEqual` lança com tamanhos diferentes. */
function segredoConfere(recebido: string, guardado: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(recebido).digest(),
    createHash("sha256").update(guardado).digest()
  );
}

function tokensDoServidor(): string[] {
  return [process.env.INGESTAO_TOKEN, process.env.INGESTAO_TOKEN_ANTERIOR]
    .map((t) => t?.trim() ?? "")
    .filter((t) => t.length >= 32);
}

export async function POST(request: NextRequest) {
  const tokens = tokensDoServidor();
  if (tokens.length === 0) {
    return recusa(
      503,
      "A ingestão não está configurada neste ambiente.",
      "Defina INGESTAO_TOKEN nas variáveis do servidor."
    );
  }

  const recebido = (request.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!recebido || !tokens.some((t) => segredoConfere(recebido, t))) {
    return recusa(401, "Chave de acesso inválida.", "Envie Authorization: Bearer <chave>.");
  }

  if (Number(request.headers.get("content-length") ?? 0) > LIMITE_DE_BYTES) {
    return recusa(413, "Corpo grande demais.", "Reduza a janela lida por execução.");
  }

  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return recusa(400, "O corpo não é JSON válido.", "Envie JSON.");
  }

  const corpo = (bruto ?? {}) as Record<string, unknown>;
  const validacao = validarAchados(corpo.achados ?? []);
  if (!validacao.ok) return recusa(400, validacao.erro, validacao.comoCorrigir);

  const falhas =
    corpo.falhas && typeof corpo.falhas === "object" && !Array.isArray(corpo.falhas)
      ? (corpo.falhas as Record<string, string>)
      : {};

  const admin = criarClienteAdmin();

  // Contagem por fonte, inclusive as que vieram zeradas — é o que permite
  // ver no painel que uma fonte parou de trazer coisa.
  const porFonte: Record<string, number> = {};
  for (const a of validacao.achados) porFonte[a.fonte] = (porFonte[a.fonte] ?? 0) + 1;

  const { data: execucao, error: erroExecucao } = await admin
    .from("vigia_execucoes")
    .insert({ achados: porFonte, falhas })
    .select("id")
    .single();

  if (erroExecucao) {
    const faltaTabela =
      erroExecucao.code === "PGRST205" || /schema cache|does not exist/i.test(erroExecucao.message);
    return faltaTabela
      ? recusa(
          503,
          "O vigia ainda não foi instalado no banco.",
          "Aplique supabase/migrations/20260930000001_vigia.sql no Supabase."
        )
      : recusa(500, `Não foi possível registrar a execução: ${erroExecucao.message}`, "Tente de novo.");
  }

  // `ignoreDuplicates` faz a URL repetida ser descartada sem erro: o vigia
  // relê os mesmos itens a cada execução, e isso é o normal, não uma falha.
  const { data: inseridas, error: erroPautas } = validacao.achados.length
    ? await admin
        .from("pautas")
        .upsert(
          validacao.achados.map((a) => ({
            fonte: a.fonte,
            tipo_de_fonte: a.tipoDeFonte,
            titulo: a.titulo,
            url: a.url,
            resumo: a.resumo,
            publicado_em: a.publicadoEm,
          })),
          { onConflict: "url", ignoreDuplicates: true }
        )
        .select("id")
    : { data: [], error: null };

  if (erroPautas) {
    // A linha de execução já foi gravada, e continua gravada de propósito:
    // sem ela esta falha ficaria indistinguível de um dia calmo. Mas ela
    // diria "3 achados" com zero pautas salvas, e registro que mente é pior
    // do que registro que falta. Corrige antes de responder.
    await admin
      .from("vigia_execucoes")
      .update({ achados: {}, falhas: { ...falhas, _gravacao: erroPautas.message } })
      .eq("id", execucao.id);

    return recusa(500, `Não foi possível gravar as pautas: ${erroPautas.message}`, "Tente de novo.");
  }

  const novas = inseridas?.length ?? 0;
  console.info(
    `[vigia] execução ${execucao.id}: ${novas} nova(s) de ${validacao.achados.length} lida(s)` +
      (Object.keys(falhas).length ? ` | falhas: ${Object.keys(falhas).join(", ")}` : "")
  );

  return NextResponse.json(
    {
      execucaoId: execucao.id,
      novas,
      repetidas: validacao.achados.length - novas,
      falhas: Object.keys(falhas),
    },
    { status: 201 }
  );
}
