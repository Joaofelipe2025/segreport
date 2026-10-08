import type { Classe } from "./pauta";

export interface Rota {
  origem: "release" | "primaria" | "derivada";
  /** Exige citar o veículo de origem ao final do texto. */
  precisaCredito: boolean;
  /** Nasce marcada: ninguém conferiu contra documento. */
  precisaChecagem: boolean;
  /** Mínimo e máximo de palavras. */
  palavras: [number, number];
}

/**
 * O que acontece com a pauta, dado o que ela é e o que se conseguiu apurar.
 *
 * Esta é a tabela que carrega a decisão do dono do veículo, dita duas vezes:
 * "não quero plágio, apenas inspiração". Só um caminho produz texto
 * derivado, e esse caminho obriga crédito.
 *
 * `precisaCredito` e `precisaChecagem` saem sempre juntos, e isso não é
 * coincidência que valha simplificar: se divergissem, uma matéria derivada
 * poderia sair creditada mas sem marca — publicável sem ninguém conferir.
 * Há teste travando a igualdade.
 */
export function rotaDaMateria(classe: Classe, achouFontePrimaria: boolean): Rota {
  if (classe === "release") {
    return {
      origem: "release",
      precisaCredito: false,
      precisaChecagem: false,
      palavras: [180, 300],
    };
  }

  return achouFontePrimaria
    ? { origem: "primaria", precisaCredito: false, precisaChecagem: false, palavras: [300, 450] }
    : { origem: "derivada", precisaCredito: true, precisaChecagem: true, palavras: [300, 450] };
}
