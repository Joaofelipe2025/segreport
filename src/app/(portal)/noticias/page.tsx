import type { Metadata } from "next";
import { getArticles } from "@/lib/data";
import { LeadCard, ListRow } from "@/components/portal/ArticleCard";
import {
  NewsletterWidget,
  MostReadWidget,
  AdSlot,
  ProWidget,
} from "@/components/portal/Sidebar";

export const metadata: Metadata = {
  title: "Novidades",
  description:
    "Todas as notícias do mercado segurador brasileiro, em ordem cronológica.",
};

export default async function NewsIndexPage() {
  const articles = await getArticles();
  const [lead, ...rest] = articles;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <header className="mb-8 border-l-[4px] border-lime-400 pl-4">
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-[40px]">
          Novidades
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-3">
          Tudo o que publicamos, da mais recente para a mais antiga.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="min-w-0">
          {lead && (
            <div className="mb-8">
              <LeadCard article={lead} />
            </div>
          )}

          <div className="border-t border-hairline pt-2">
            {rest.map((article) => (
              <ListRow key={article.slug} article={article} showStandfirst />
            ))}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <NewsletterWidget />
          <AdSlot slot="noticias-sidebar" />
          <MostReadWidget />
          <ProWidget />
        </aside>
      </div>
    </div>
  );
}
