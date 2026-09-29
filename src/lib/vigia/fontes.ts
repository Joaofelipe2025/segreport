/**
 * As fontes que o vigia acompanha.
 *
 * `tipo` não é rótulo: é o que separa as duas saídas do sistema. Fonte de
 * imprensa produz PAUTA e nada mais — o texto dela nunca alcança um gerador
 * de matéria. Fonte primária, que entra nas etapas 2 e 3, produz matéria
 * redigida a partir do documento.
 *
 * A decisão é editorial e foi tomada pelo dono do veículo: outros veículos
 * servem de alerta, nunca de texto. Este campo é o que torna isso
 * verificável no código em vez de confiável por disciplina.
 */
export type TipoDeFonte = "imprensa" | "primaria";

export interface Fonte {
  chave: string;
  nome: string;
  url: string;
  tipo: TipoDeFonte;
}

export const FONTES: readonly Fonte[] = [
  { chave: "cqcs", nome: "CQCS", url: "https://cqcs.com.br/feed/", tipo: "imprensa" },
  {
    chave: "apolice",
    nome: "Revista Apólice",
    url: "https://www.revistaapolice.com.br/feed/",
    tipo: "imprensa",
  },
  {
    chave: "sonho-seguro",
    nome: "Sonho Seguro",
    url: "https://sonhoseguro.com.br/feed/",
    tipo: "imprensa",
  },
] as const;

const PORCHAVE = new Map(FONTES.map((f) => [f.chave, f]));

/** `Map` e não objeto: busca literal responderia a `constructor` e `__proto__`. */
export function fontePorChave(chave: string): Fonte | null {
  return PORCHAVE.get(chave) ?? null;
}
