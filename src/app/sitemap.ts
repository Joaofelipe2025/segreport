import type { MetadataRoute } from "next";
import { listarColunistas, listarPublicadas } from "@/lib/data/articles-db";
import { CATEGORIES } from "@/lib/categories";
import { origemDoSite } from "@/lib/painel/origem";
import { urlAbsoluta } from "@/lib/portal/sindicacao";

/**
 * Mapa do site.
 *
 * Sem ele, o Google descobre matéria nova por acaso — seguindo link da home,
 * quando passar. Para veículo de notícia isso é a diferença entre aparecer na
 * busca no dia e aparecer na semana seguinte.
 *
 * `lastModified` sai da data de publicação, não de `new Date()`: carimbar
 * tudo com "agora" a cada geração faz o buscador aprender que as datas deste
 * site não significam nada, e ele passa a ignorá-las.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origem = origemDoSite();
  const u = (caminho: string) => urlAbsoluta(origem, caminho);

  const [materias, colunistas] = await Promise.all([
    listarPublicadas({ limite: 1000 }),
    listarColunistas(),
  ]);

  const maisRecente = materias.find((m) => m.publishedAt)?.publishedAt;

  const fixas: MetadataRoute.Sitemap = [
    { url: u("/"), changeFrequency: "hourly", priority: 1, lastModified: maisRecente },
    { url: u("/noticias"), changeFrequency: "hourly", priority: 0.9, lastModified: maisRecente },
    { url: u("/colunistas"), changeFrequency: "weekly", priority: 0.6 },
    { url: u("/hub"), changeFrequency: "daily", priority: 0.8 },
    { url: u("/premium"), changeFrequency: "monthly", priority: 0.7 },
    { url: u("/flash"), changeFrequency: "daily", priority: 0.5 },
    { url: u("/eventos"), changeFrequency: "weekly", priority: 0.5 },
    { url: u("/anuncie"), changeFrequency: "monthly", priority: 0.4 },
    { url: u("/contato"), changeFrequency: "yearly", priority: 0.3 },
    { url: u("/termos"), changeFrequency: "yearly", priority: 0.1 },
    { url: u("/privacidade"), changeFrequency: "yearly", priority: 0.1 },
  ];

  const editorias: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: u(`/${c.slug}`),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const noticias: MetadataRoute.Sitemap = materias.map((m) => ({
    url: u(`/noticias/${m.slug}`),
    lastModified: m.publishedAt || undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const autores: MetadataRoute.Sitemap = colunistas
    .filter((c) => c.slug)
    .map((c) => ({
      url: u(`/colunistas/${c.slug}`),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  return [...fixas, ...editorias, ...noticias, ...autores];
}
