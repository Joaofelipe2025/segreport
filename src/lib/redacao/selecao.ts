import type { Grupo } from "./agrupamento";

/**
 * Quantas matérias uma execução pode produzir.
 *
 * Teto no código, não no prompt. Cinco por dia são trinta e cinco por
 * semana; fila de revisão que acumula deixa de ser lida, que é o mesmo modo
 * de falha da tela de pautas.
 */
export const TETO_POR_EXECUCAO = 10;

/**
 * Ordena por relevância e corta no teto.
 *
 * A repercussão é o sinal mais barato e mais honesto que temos sem gastar
 * modelo: um fato que três veículos cobriram importa mais do que um que só
 * um cobriu. O desempate é pela data — notícia velha interessa menos.
 */
export function selecionar(grupos: Grupo[]): Grupo[] {
  return [...grupos]
    .sort((a, b) => {
      const porRepercussao = b.pautas.length - a.pautas.length;
      if (porRepercussao !== 0) return porRepercussao;
      return (b.principal.publicadoEm ?? "").localeCompare(
        a.principal.publicadoEm ?? ""
      );
    })
    .slice(0, TETO_POR_EXECUCAO);
}
