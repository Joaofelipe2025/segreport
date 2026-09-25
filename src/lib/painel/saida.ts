/**
 * Sair da página com texto não salvo.
 *
 * `beforeunload` cobre fechar a aba, recarregar e sair do domínio — e só
 * isso. A navegação do App Router é feita no cliente e não dispara o evento,
 * então clicar em "← Matérias", que fica quatro linhas acima do editor, ou em
 * qualquer item da barra lateral levava o texto embora sem uma palavra. Essas
 * são as saídas prováveis; fechar a aba é a menos provável das três.
 */

export const AVISO_DE_SAIDA =
  "Você tem texto não salvo nesta matéria. Se sair agora, ele se perde. Sair mesmo assim?";

/**
 * Comparar só o caminho, ignorando a query: trocar o filtro da listagem ou
 * reordenar não descarta nada, e pedir confirmação nesses casos ensina a
 * clicar em "sair" sem ler.
 */
function caminhoDe(url: string): string {
  return url.split(/[?#]/)[0];
}

export function deveAvisarAoSair(sujo: boolean, atual: string, destino: string): boolean {
  if (!sujo) return false;
  return caminhoDe(atual) !== caminhoDe(destino);
}
