import { listarColunistas, listarPublicadas } from "@/lib/data/articles-db";
import { origemDoSite } from "@/lib/painel/origem";
import { escaparXml, itemDeRss, urlAbsoluta } from "@/lib/portal/sindicacao";
import { CATEGORIES } from "@/lib/categories";

/**
 * Feed RSS do portal.
 *
 * O mercado de seguros acompanha imprensa por agregador. Sem feed, o veículo
 * simplesmente não entra na rotina de quem lê o setor — é o canal de
 * distribuição mais barato que existe e estava faltando.
 *
 * Só matéria publicada, e só o resumo: o corpo não sai daqui. O paywall
 * continua sendo decidido na camada de dados.
 */
export const revalidate = 600;

export async function GET() {
  const origem = origemDoSite();
  const [materias, colunistas] = await Promise.all([
    listarPublicadas({ limite: 40 }),
    listarColunistas(),
  ]);

  // O feed assina com o NOME, não com o endereço: "da-redacao" no lugar de
  // "Da Redação" é o tipo de detalhe que denuncia site gerado.
  const nomePorSlug = new Map(colunistas.map((c) => [c.slug, c.name]));

  // Categoria vai com o rótulo, não com a chave: leitor de feed mostra este
  // campo cru, e "cyber" no lugar de "Cyber" aparece para o assinante.
  const rotuloDaCategoria = new Map(CATEGORIES.map((c) => [c.slug, c.label]));

  const itens = materias
    .map((m) =>
      itemDeRss(origem, {
        slug: m.slug,
        title: m.title,
        excerpt: m.standfirst || null,
        publishedAt: m.publishedAt || null,
        autor: nomePorSlug.get(m.authorSlug) ?? null,
        categoria: rotuloDaCategoria.get(m.category) ?? m.category ?? null,
      })
    )
    .join("\n");

  const maisRecente = materias.find((m) => m.publishedAt)?.publishedAt;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SegReport</title>
    <link>${escaparXml(origem)}</link>
    <description>${escaparXml("Notícias e inteligência do mercado segurador brasileiro.")}</description>
    <language>pt-BR</language>
    <atom:link href="${escaparXml(urlAbsoluta(origem, "/feed.xml"))}" rel="self" type="application/rss+xml" />
${maisRecente ? `    <lastBuildDate>${new Date(maisRecente).toUTCString()}</lastBuildDate>\n` : ""}${itens}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
