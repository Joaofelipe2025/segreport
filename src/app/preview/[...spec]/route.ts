import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { renderPreviewPng } from "@/lib/preview-image";

/**
 * Serve as imagens do preview em `/preview/{semente}/{largura}/{altura}`.
 *
 * A imagem é determinística: a mesma URL produz sempre os mesmos bytes. A
 * primeira versão regenerava o PNG a cada pedido, o que é desperdício puro —
 * e desperdício caro: cada geração aloca o buffer RGB, o buffer com bytes de
 * filtro e a saída do deflate, cerca de 8 MB para uma imagem de 1400×900.
 * Com dezenas de imagens pedidas em paralelo, isso vira um pico de memória
 * que já derrubou o servidor de desenvolvimento por estouro de heap.
 *
 * Agora a primeira geração grava em disco e as seguintes só leem o arquivo.
 */

/** Teto de tamanho — evita que uma URL forjada peça uma imagem gigante. */
const MAX_DIMENSION = 1600;

const CACHE_DIR = path.join(os.tmpdir(), "segreport-preview");

export async function GET(
  _request: Request,
  context: { params: Promise<{ spec: string[] }> }
) {
  const { spec } = await context.params;
  const [rawSeed, rawWidth, rawHeight] = spec;

  if (!rawSeed) {
    return new Response("Semente ausente", { status: 400 });
  }

  const seed = decodeURIComponent(rawSeed);
  const width = clampDimension(rawWidth, 1200);
  const height = clampDimension(rawHeight, 800);

  const png = await readOrRender(seed, width, height);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // A saída nunca muda para a mesma URL, então pode ser cacheada para sempre.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

async function readOrRender(
  seed: string,
  width: number,
  height: number
): Promise<Buffer> {
  // A semente vem da URL e pode conter qualquer coisa, inclusive barras e
  // acentos. O hash produz um nome de arquivo seguro e de tamanho fixo.
  const key = createHash("sha1")
    .update(`${seed}|${width}|${height}`)
    .digest("hex");
  const file = path.join(CACHE_DIR, `${key}.png`);

  try {
    return await readFile(file);
  } catch {
    // Ausente ou ilegível: gera abaixo.
  }

  const png = renderPreviewPng(seed, width, height);

  // Gravação é oportunista: falhar no cache não pode impedir a resposta.
  // Escreve num arquivo temporário e renomeia, para que um pedido concorrente
  // nunca leia um PNG pela metade — renomear é atômico no mesmo volume.
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, png);
    await rename(temp, file);
  } catch {
    // Segue servindo os bytes que já estão em memória.
  }

  return png;
}

function clampDimension(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_DIMENSION);
}
