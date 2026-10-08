/**
 * As fontes que o vigia acompanha.
 *
 * `tipo` não é rótulo: é o que separa as duas saídas do sistema. Fonte de
 * imprensa produz PAUTA: serve de alerta e de inspiração, não de texto para
 * copiar. Fonte primária, que entra nas etapas 2 e 3, produz matéria
 * redigida a partir do documento.
 *
 * A decisão é editorial e foi tomada pelo dono do veículo: "não quero
 * plágio, apenas inspiração". A pergunta que o código faz não é mais "o
 * texto de imprensa alcança o gerador?" — pode alcançar —, e sim "esta
 * matéria precisa citar a origem?". Matéria derivada de cobertura alheia
 * nasce com `origem = 'derivada'`, exige o endereço da fonte (restrição do
 * banco) e nasce marcada para checagem. Este campo é o que torna isso
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
