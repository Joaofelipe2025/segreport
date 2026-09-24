import { createClient } from "@/lib/supabase/server";
import { photo } from "./media";
import type { Article, CategorySlug, Tier } from "@/lib/types";
import type { DocumentoBlocos } from "@/lib/editor/document";

/**
 * Leitura de matérias vinda do Supabase.
 *
 * Substitui as fixtures para tudo que o CMS produz. Os indicadores, rankings
 * e o Flash continuam em arquivo até o sub-projeto do Hub — e isso está
 * marcado em `index.ts`, não escondido aqui.
 *
 * O CORPO nunca vem por estas consultas. As colunas `content`, `content_json`
 * e `content_text` foram revogadas de `anon` e `authenticated`: o corpo sai
 * pela função `article_body_json`, que aplica o direito de quem pede. Uma
 * listagem não precisa do corpo, e assim não há como vazá-lo por descuido.
 */

/** Colunas seguras de listagem — sem corpo. */
const CAMPOS = `
  id, slug, title, standfirst, excerpt, cover_url, status, is_premium,
  reading_time, published_at, updated_at,
  categories ( key ),
  authors ( slug, name )
` as const;

interface LinhaDeMateria {
  id: string;
  slug: string;
  title: string;
  standfirst: string | null;
  excerpt: string | null;
  cover_url: string | null;
  status: string;
  is_premium: boolean;
  reading_time: number | null;
  published_at: string | null;
  updated_at: string;
  categories: { key: string } | null;
  authors: { slug: string | null; name: string } | null;
}

/**
 * Converte a linha do banco no formato que os componentes já consomem.
 *
 * Sem capa cadastrada, cai na imagem gerada pela semente do slug — melhor um
 * espaço preenchido e estável que um buraco no layout.
 */
function paraArticle(linha: LinhaDeMateria): Article {
  return {
    slug: linha.slug,
    title: linha.title,
    standfirst: linha.standfirst ?? linha.excerpt ?? "",
    category: (linha.categories?.key ?? "mercado") as CategorySlug,
    authorSlug: linha.authors?.slug ?? "redacao",
    publishedAt: linha.published_at ?? linha.updated_at,
    readingMinutes: linha.reading_time ?? 1,
    image: linha.cover_url ?? photo(linha.slug, 1200, 800),
    imageAlt: linha.title,
    body: [],
    tags: [],
    minTier: linha.is_premium ? "pro" : undefined,
  };
}

export async function listarPublicadas(opcoes?: {
  categoria?: CategorySlug;
  autorSlug?: string;
  limite?: number;
  excluir?: string[];
}): Promise<Article[]> {
  const supabase = await createClient();

  let consulta = supabase
    .from("articles")
    .select(CAMPOS)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (opcoes?.limite) consulta = consulta.limit(opcoes.limite);

  const { data, error } = await consulta;
  if (error || !data) return [];

  let linhas = data as unknown as LinhaDeMateria[];

  // Filtro por categoria e autor acontece aqui, não na consulta: a relação
  // vem por junção, e filtrar por coluna de tabela junta exigiria uma view.
  // Com o volume de um portal diário, o custo é irrelevante.
  if (opcoes?.categoria) {
    linhas = linhas.filter((l) => l.categories?.key === opcoes.categoria);
  }
  if (opcoes?.autorSlug) {
    linhas = linhas.filter((l) => l.authors?.slug === opcoes.autorSlug);
  }
  if (opcoes?.excluir?.length) {
    linhas = linhas.filter((l) => !opcoes.excluir!.includes(l.slug));
  }

  return linhas.map(paraArticle);
}

export async function buscarPorSlug(slug: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(CAMPOS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data ? paraArticle(data as unknown as LinhaDeMateria) : null;
}

/**
 * Corpo da matéria, já cortado conforme o direito de quem pede.
 *
 * Chama a função do banco em vez de ler a coluna: é lá que mora a regra
 * "depende de quem pede E de qual linha é", que RLS sozinha não expressa.
 */
export async function buscarCorpo(slug: string): Promise<DocumentoBlocos | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("article_body_json", { p_slug: slug });
  if (error || !data) return null;
  return data as unknown as DocumentoBlocos;
}

export async function listarColunistas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("authors")
    .select("id, name, slug, role, bio, avatar_url")
    .not("slug", "is", null)
    .order("name");
  return data ?? [];
}

export async function buscarColunista(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("authors")
    .select("id, name, slug, role, bio, avatar_url")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

/** Existe alguma matéria publicada? Decide entre portal e aviso de estreia. */
export async function temConteudoPublicado(): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  return (count ?? 0) > 0;
}

export type { Tier };
