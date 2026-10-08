/** Uma pauta como ela sai do banco, com os nomes em português do domínio. */
export interface PautaBruta {
  id: string;
  fonte: string;
  tipoDeFonte: "imprensa" | "primaria";
  titulo: string;
  url: string;
  resumo: string | null;
  publicadoEm: string | null;
  estado: string;
  criadoEm: string;
}

/**
 * O que a pauta é, e portanto como será tratada.
 *
 * `release` não tem dono: o comunicado veio do próprio interessado e todos
 * os veículos receberam igual, então não há a quem creditar. `apuracao` tem
 * dono, e é por isso que precisa de crédito quando a fonte primária não for
 * encontrada.
 */
export type Classe = "release" | "apuracao";
