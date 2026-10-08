/**
 * O nome a exibir no crédito ao veículo de origem.
 *
 * Devolve nulo quando não há o que creditar. O `www.` sai e o caminho
 * também: o rodapé mostra de onde veio, não o endereço inteiro com os
 * parâmetros de rastreio que vieram no feed.
 */
export function creditoDaFonte(a: {
  fonteUrl?: string | null;
  fonteNome?: string | null;
}): string | null {
  const nome = a.fonteNome?.trim();
  if (nome) return nome;

  const url = a.fonteUrl?.trim();
  if (!url) return null;

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // Endereço ilegível não pode derrubar a página da matéria.
    return null;
  }
}
