import { XMLParser } from "fast-xml-parser";

/**
 * Um item de feed, já normalizado.
 *
 * `publicadoEm` é ISO ou nulo — nunca "Invalid Date". Data ilegível
 * envenena a ordenação da lista inteira, e feed recém-migrado produz isso
 * com frequência.
 */
export interface ItemDeFeed {
  titulo: string;
  url: string;
  resumo: string | null;
  publicadoEm: string | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  // Sem isto, um feed com um único <item> devolve objeto e não lista, e o
  // código quebra só naquele dia em que a fonte publicou uma vez.
  isArray: (nome) => nome === "item",
  processEntities: true,
  // O fast-xml-parser só decodifica referência numérica (&#038;) com esta
  // flag ligada — processEntities sozinho cobre só as 5 entidades XML
  // padrão. O WordPress emite título com "&#038;" no lugar de "&", e sem
  // isto ele chega cru na tela.
  htmlEntities: true,
  trimValues: true,
});

/** CDATA e texto puro chegam como string ou como objeto; os dois viram texto. */
function texto(valor: unknown): string {
  if (typeof valor === "string") return valor;
  if (typeof valor === "number") return String(valor);
  if (valor && typeof valor === "object" && "#text" in valor) {
    return String((valor as { "#text": unknown })["#text"]);
  }
  return "";
}

const NOMEADAS: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Decodifica entidade de HTML.
 *
 * O `htmlEntities` do parser resolve o texto comum, mas NÃO o que está
 * dentro de CDATA — ali entidade é texto literal, e tem de ser, porque
 * CDATA existe para não ser interpretado. Os três feeds põem a descrição em
 * CDATA, então sem isto o resumo chega à tela com `&#8230;` e `&#38;` à
 * mostra. O ramo numérico é o que morde: o WordPress emite `&#038;` no
 * lugar de `&amp;` para não codificar duas vezes.
 */
function decodificar(texto: string): string {
  return texto.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, (bruto, corpo: string) => {
    if (corpo[0] !== "#") return NOMEADAS[corpo.toLowerCase()] ?? bruto;
    const hex = corpo[1] === "x" || corpo[1] === "X";
    const n = parseInt(corpo.slice(hex ? 2 : 1), hex ? 16 : 10);
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : bruto;
  });
}

/**
 * Tira marcação e comprime espaço. O resumo vai para a tela e para o banco.
 *
 * Tira a marcação ANTES de decodificar: ao contrário, `&lt;b&gt;` viraria
 * `<b>` e seria removido em seguida, apagando texto que o autor escreveu
 * escapado justamente para aparecer.
 */
function semHtml(bruto: string): string {
  return decodificar(bruto.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function dataIso(bruto: string): string | null {
  if (!bruto.trim()) return null;
  const d = new Date(bruto);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function lerFeed(xml: string): ItemDeFeed[] {
  if (!xml.trim()) return [];

  let arvore: Record<string, unknown>;
  try {
    arvore = parser.parse(xml) as Record<string, unknown>;
  } catch {
    // Fonte fora do ar costuma devolver página de erro com HTTP 200.
    return [];
  }

  const canal = (arvore?.rss as { channel?: { item?: unknown[] } })?.channel;
  const itens = Array.isArray(canal?.item) ? canal.item : [];

  return itens
    .map((bruto) => {
      const i = bruto as Record<string, unknown>;

      // SÓ <link>. O WordPress também emite <comments> com a mesma URL mais
      // "#respond", e <guid isPermaLink="false">, que é identificador
      // interno e não endereço. Pegar qualquer um dos dois quebra o dedupe.
      const url = texto(i.link).trim();
      const titulo = texto(i.title).trim();
      if (!url || !titulo) return null;

      const resumoBruto = semHtml(texto(i.description));

      return {
        titulo,
        url,
        resumo: resumoBruto || null,
        publicadoEm: dataIso(texto(i.pubDate)),
      } satisfies ItemDeFeed;
    })
    .filter((i): i is ItemDeFeed => i !== null);
}
