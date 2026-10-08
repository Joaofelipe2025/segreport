import type { PautaBruta } from "./pauta";

/** Quanto tempo uma pauta pode ficar reservada antes de voltar para a fila. */
const RESERVA_MINUTOS = 60;

export interface Grupo {
  pautas: PautaBruta[];
  /** A que publicou primeiro. É dela que saem título e endereço de origem. */
  principal: PautaBruta;
}

/**
 * Reduz o título ao seu esqueleto, para comparar fatos e não redações.
 *
 * Acento, caixa, pontuação e palavra de ligação saem. "Seguradora X anuncia
 * aquisição da Y" e "Seguradora X anuncia a aquisição da Y" viram a mesma
 * coisa — que é o que elas são.
 *
 * A ordem das palavras é preservada de propósito: "A compra B" e "B compra A"
 * são fatos diferentes, assim como "6,9%" e "9,6%". Agrupar errado perde
 * notícia em silêncio; separar errado só gera duas matérias que o dono vê e
 * descarta.
 */
const LIGACAO = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na",
  "nos", "nas", "um", "uma", "para", "por", "com", "que", "ao", "aos",
]);

function esqueleto(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 0 && !LIGACAO.has(p))
    .join(" ");
}

/**
 * Junta pautas que reproduzem o mesmo comunicado.
 *
 * A chave é o esqueleto do título, NÃO a URL: veículos diferentes publicam o
 * mesmo release em endereços diferentes, e agrupar por URL não agruparia
 * nada. Era a lacuna óbvia.
 */
export function agrupar(pautas: PautaBruta[]): Grupo[] {
  const porEsqueleto = new Map<string, PautaBruta[]>();

  for (const p of pautas) {
    // Título que reduz a nada (só ligação, só símbolo, alfabeto não latino)
    // usa a URL como chave: única por construção, não engole as outras.
    const esq = esqueleto(p.titulo);
    const chave = esq === "" ? `url:${p.url}` : `titulo:${esq}`;
    const lista = porEsqueleto.get(chave);
    if (lista) lista.push(p);
    else porEsqueleto.set(chave, [p]);
  }

  return [...porEsqueleto.values()].map((lista) => ({
    pautas: lista,
    principal: maisAntiga(lista),
  }));
}

/** A que publicou primeiro. Sem data, a primeira da lista — e nunca indefinida. */
function maisAntiga(lista: PautaBruta[]): PautaBruta {
  return lista.reduce((melhor, atual) => {
    if (!atual.publicadoEm) return melhor;
    if (!melhor.publicadoEm) return atual;
    return atual.publicadoEm < melhor.publicadoEm ? atual : melhor;
  }, lista[0]);
}

/**
 * A reserva morreu?
 *
 * Uma execução interrompida deixa a pauta em `em_producao` para sempre, e
 * ela some da fila sem nunca virar matéria. A expiração devolve a pauta.
 *
 * Data ilegível conta como expirada: pauta de volta na fila é recuperável,
 * pauta presa para sempre não é.
 */
export function reservaExpirada(
  estado: string,
  atualizadoEm: string,
  agora: Date
): boolean {
  if (estado !== "em_producao") return false;
  const idade = agora.getTime() - new Date(atualizadoEm).getTime();
  if (Number.isNaN(idade)) return true;
  return idade > RESERVA_MINUTOS * 60_000;
}
