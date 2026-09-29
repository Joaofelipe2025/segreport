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

/** Tira marcação e comprime espaço. O resumo vai para a tela e para o banco. */
function semHtml(bruto: string): string {
  return bruto
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
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
