/**
 * Imagens do preview.
 *
 * Enquanto não há CMS, as fotos vêm do Picsum com semente fixa — cada slug
 * sempre devolve a mesma imagem, então o layout não "pisca" entre builds.
 * Não são fotos do setor: servem para validar enquadramento, proporção e
 * hierarquia. Quando o upload do CMS entrar, troca-se apenas esta função e
 * o `remotePatterns` do next.config.
 */
export function photo(seed: string, width: number, height: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

/** Avatares de colunistas — proporção quadrada. */
export function avatar(seed: string, size = 160): string {
  return `https://picsum.photos/seed/${encodeURIComponent(`av-${seed}`)}/${size}/${size}`;
}
