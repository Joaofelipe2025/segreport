import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticles } from "@/lib/data";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { StripCard, ListRow } from "@/components/portal/ArticleCard";
import {
  NewsletterWidget,
  MostReadWidget,
  AdSlot,
  ProWidget,
} from "@/components/portal/Sidebar";

/**
 * Página de categoria.
 *
 * Rota dinâmica na raiz para dar URL limpa (/mercado, /tecnologia). As rotas
 * estáticas — /noticias, /flash, /eventos, /hub — têm prioridade sobre o
 * segmento dinâmico no Next, então não há colisão; qualquer outro slug cai
 * no notFound abaixo.
 */
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[categoria]">
): Promise<Metadata> {
  const { categoria } = await props.params;
  const category = getCategory(categoria);
  if (!category) return { title: "Categoria não encontrada" };

  return {
    title: category.label,
    description: category.description,
  };
}

export default async function CategoryPage(props: PageProps<"/[categoria]">) {
  const { categoria } = await props.params;
  const category = getCategory(categoria);
  if (!category) notFound();

  const articles = await getArticles({ category: category.slug });
  const [featured, ...rest] = articles;
  const highlights = rest.slice(0, 3);
  const remaining = rest.slice(3);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <header className="mb-8 border-l-[4px] border-lime-400 pl-4">
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-[40px]">
          {category.label}
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-3">
          {category.description}
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-wide text-ink-4">
          {articles.length} {articles.length === 1 ? "matéria" : "matérias"}
        </p>
      </header>

      {articles.length === 0 ? (
        <EmptyState label={category.label} />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          <div className="min-w-0">
            {featured && (
              <div className="mb-8">
                <StripCard article={featured} />
              </div>
            )}

            {highlights.length > 0 && (
              <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
                {highlights.map((article) => (
                  <StripCard key={article.slug} article={article} />
                ))}
              </div>
            )}

            {remaining.length > 0 && (
              <div className="border-t border-hairline pt-2">
                {remaining.map((article) => (
                  <ListRow key={article.slug} article={article} showStandfirst />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <NewsletterWidget />
            <AdSlot slot={`categoria-${category.slug}-sidebar`} />
            <MostReadWidget />
            <ProWidget />
          </aside>
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-white/60 px-6 py-16 text-center">
      <p className="text-base font-semibold text-ink">
        Ainda não há matérias publicadas em {label}.
      </p>
      <p className="mt-2 text-sm text-ink-3">
        Assine a newsletter para receber as primeiras assim que saírem.
      </p>
    </div>
  );
}
