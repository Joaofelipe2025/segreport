/**
 * Regras do envio de imagem, em código puro.
 *
 * Ficam aqui, e não dentro da Server Action, porque a Server Action não é
 * testável nesta suíte — e validação de arquivo enviado é exatamente o tipo
 * de coisa que precisa de teste: quem envia controla o nome, o tipo
 * declarado e o tamanho.
 */

/** O balde aceita só estes, e o Storage recusa o resto de novo do lado dele. */
export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export const LIMITE_DE_BYTES = 5 * 1024 * 1024;

/**
 * SVG não entra. É XML, executa script quando servido como imagem, e o balde
 * é público — uma capa não vale esse risco.
 */
const EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function problemaNoArquivo(arquivo: File | null): string | null {
  if (!arquivo) return "Escolha uma imagem para enviar.";
  if (arquivo.size === 0) return "O arquivo chegou vazio. Tente enviar de novo.";
  if (!(TIPOS_ACEITOS as readonly string[]).includes(arquivo.type)) {
    return "Formato não aceito. Envie JPG, PNG, WebP ou AVIF.";
  }
  if (arquivo.size > LIMITE_DE_BYTES) {
    const mb = (arquivo.size / 1024 / 1024).toFixed(1);
    return `A imagem tem ${mb} MB e o limite é 5 MB. Reduza antes de enviar.`;
  }
  return null;
}

/**
 * Onde o arquivo mora no balde.
 *
 * O nome de origem NÃO entra no caminho: ele vem do computador de quem envia,
 * e aceitá-lo traz barra (que vira pasta), `..` (que sobe de nível) e
 * extensão mentirosa — "foto.jpg" que é PNG. A extensão sai do tipo
 * declarado, e o nome, de um identificador nosso.
 */
export function nomeNoBalde(_nomeDeOrigem: string, tipo: string, id: string): string {
  return `capas/${id}.${EXTENSAO[tipo] ?? "bin"}`;
}
