import type { Classe } from "./pauta";

export interface Rota {
  origem: "release" | "primaria" | "derivada";
  /** Mínimo e máximo de palavras. */
  palavras: [number, number];
}

/**
 * Qual `origem` a matéria terá, dado o que a pauta é e o que se apurou.
 *
 * Esta é a tabela que carrega a decisão do dono do veículo, dita duas vezes:
 * "não quero plágio, apenas inspiração". Só um caminho produz texto
 * derivado.
 *
 * Esta função decide APENAS a origem. O que cada origem implica — crédito
 * obrigatório e marca de checagem — mora num lugar só, `camposDaProcedencia`
 * (src/lib/ingestao/contrato.ts), que é o que a rota executa de fato. Antes
 * havia uma cópia da regra aqui, sem nenhum consumidor além do próprio
 * teste: uma tabela que nada executa não trava nada.
 */
export function rotaDaMateria(classe: Classe, achouFontePrimaria: boolean): Rota {
  if (classe === "release") {
    return { origem: "release", palavras: [180, 300] };
  }

  return achouFontePrimaria
    ? { origem: "primaria", palavras: [300, 450] }
    : { origem: "derivada", palavras: [300, 450] };
}
