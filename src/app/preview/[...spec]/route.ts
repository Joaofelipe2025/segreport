import { renderPreviewPng } from "@/lib/preview-image";

/**
 * Serve as imagens do preview em `/preview/{semente}/{largura}/{altura}`.
 *
 * Gerar sob demanda em vez de versionar centenas de arquivos: a imagem é
 * determinística pela semente, então o resultado é estável entre execuções,
 * e o cache imutável faz cada uma ser calculada uma única vez.
 */

/** Teto de tamanho — evita que uma URL forjada peça uma imagem gigante. */
const MAX_DIMENSION = 2000;

export async function GET(
  _request: Request,
  context: { params: Promise<{ spec: string[] }> }
) {
  const { spec } = await context.params;
  const [seed, rawWidth, rawHeight] = spec;

  if (!seed) {
    return new Response("Semente ausente", { status: 400 });
  }

  const width = clampDimension(rawWidth, 1200);
  const height = clampDimension(rawHeight, 800);

  const png = renderPreviewPng(decodeURIComponent(seed), width, height);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // A saída nunca muda para a mesma URL, então pode ser cacheada para sempre.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

function clampDimension(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_DIMENSION);
}
