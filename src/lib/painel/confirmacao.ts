/**
 * Exclusão pede o título digitado.
 *
 * Excluir é a única ação do painel que não tem volta: não há lixeira, e a
 * linha some com o texto junto. Um `confirm()` de navegador é clicado no
 * automático; digitar o título obriga a olhar o que se está apagando.
 *
 * Tolerante com espaço e com caixa porque quem copia o título da tela traz
 * espaço, e recusar por isso é hostil sem ser mais seguro. Título vazio nunca
 * confere: senão a confirmação viraria apertar Enter.
 */
export function confirmacaoConfere(digitado: string, titulo: string): boolean {
  const a = digitado.trim().toLocaleLowerCase("pt-BR");
  const b = titulo.trim().toLocaleLowerCase("pt-BR");
  if (a.length === 0 || b.length === 0) return false;
  return a === b;
}
