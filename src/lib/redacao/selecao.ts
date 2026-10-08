import type { Grupo } from "./agrupamento";

/**
 * Quantas matérias uma execução pode produzir.
 *
 * Teto no código, não no prompt. Cinco por dia são trinta e cinco por
 * semana; fila de revisão que acumula deixa de ser lida, que é o mesmo modo
 * de falha da tela de pautas.
 */
export const TETO_POR_EXECUCAO = 10;

/** Quantos VEÍCULOS cobriram, não quantas pautas: o mesmo veículo pode repetir. */
function veiculos(g: Grupo): number {
  return new Set(g.pautas.map((p) => p.fonte)).size;
}

/**
 * Ordena por relevância e corta no teto.
 *
 * A repercussão é o sinal mais barato e mais honesto que temos sem gastar
 * modelo: um fato que três veículos cobriram importa mais do que um que só
 * um cobriu. Conta-se veículo distinto: um veículo só publicando três peças
 * de título quase igual não é repercussão. O desempate é pela data — notícia velha interessa menos.
 */
export function selecionar(grupos: Grupo[]): Grupo[] {
  return [...grupos]
    .sort((a, b) => {
      const porRepercussao = veiculos(b) - veiculos(a);
      if (porRepercussao !== 0) return porRepercussao;
      return (b.principal.publicadoEm ?? "").localeCompare(
        a.principal.publicadoEm ?? ""
      );
    })
    .slice(0, TETO_POR_EXECUCAO);
}
