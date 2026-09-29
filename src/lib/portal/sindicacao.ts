/**
 * Peças de RSS e sitemap.
 *
 * O portal não tinha nenhum dos dois. Para veículo de notícia isso não é
 * detalhe: sem sitemap o Google News não descobre a matéria a tempo, e o
 * mercado de seguros lê por agregador — sem feed, o veículo fica fora da
 * rotina de quem acompanha o setor.
 *
 * Montado à mão, sem biblioteca: são poucas linhas, e a única parte
 * realmente arriscada — o escape — fica visível e testada.
 */

export function urlAbsoluta(origem: string, caminho: string): string {
  const base = origem.replace(/\/+$/, "");
  const rota = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return `${base}${rota}`;
}

/**
 * Escapa os cinco caracteres que quebram XML.
 *
 * A ORDEM IMPORTA: `&` primeiro. Trocar `<` por `&lt;` antes produziria
 * `&amp;lt;` no passo seguinte, e o leitor mostra o código em vez do
 * símbolo. Título de jornal usa aspas e "&" o tempo todo.
 */
export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface MateriaDoFeed {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  autor: string | null;
  categoria: string | null;
}

export function itemDeRss(origem: string, m: MateriaDoFeed): string {
  const link = urlAbsoluta(origem, `/noticias/${m.slug}`);
  const linhas = [
    `      <title>${escaparXml(m.title)}</title>`,
    `      <link>${escaparXml(link)}</link>`,
    `      <guid isPermaLink="true">${escaparXml(link)}</guid>`,
  ];

  if (m.excerpt?.trim()) {
    linhas.push(`      <description>${escaparXml(m.excerpt.trim())}</description>`);
  }

  // Data ausente não vira `<pubDate>Invalid Date</pubDate>`: alguns leitores
  // descartam o arquivo inteiro diante de uma data ilegível, e aí não é uma
  // matéria que some, são todas.
  if (m.publishedAt) {
    const d = new Date(m.publishedAt);
    if (!Number.isNaN(d.getTime())) {
      linhas.push(`      <pubDate>${d.toUTCString()}</pubDate>`);
    }
  }

  if (m.categoria?.trim()) {
    linhas.push(`      <category>${escaparXml(m.categoria.trim())}</category>`);
  }
  if (m.autor?.trim()) {
    linhas.push(`      <dc:creator>${escaparXml(m.autor.trim())}</dc:creator>`);
  }

  return `    <item>\n${linhas.join("\n")}\n    </item>`;
}
