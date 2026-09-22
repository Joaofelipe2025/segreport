import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuthor, getArticles } from "@/lib/data";
import { AUTHORS } from "@/lib/data/authors";
import { ListRow } from "@/components/portal/ArticleCard";
import { NewsletterWidget, AdSlot } from "@/components/portal/Sidebar";

export function generateStaticParams() {
  return AUTHORS.filter((a) => a.columnist).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  props: PageProps<"/colunistas/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const author = await getAuthor(slug);
  if (!author) return { title: "Colunista não encontrado" };

  return { title: author.name, description: author.bio };
}

export default async function ColunistaPage(
  props: PageProps<"/colunistas/[slug]">
) {
  const { slug } = await props.params;
  const author = await getAuthor(slug);
  if (!author) notFound();

  const articles = await getArticles({ authorSlug: author.slug });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <header className="mb-9 flex flex-wrap items-start gap-6 border-b border-hairline pb-8">
        <Image
          src={author.avatar}
          alt=""
          width={104}
          height={104}
          className="h-[104px] w-[104px] rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-forest-600">
            {author.role}
          </p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-[-0.025em] text-ink sm:text-[38px]">
            {author.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-3">
            {author.bio}
          </p>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="min-w-0">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-[0.1em] text-ink-3">
            {articles.length} {articles.length === 1 ? "publicação" : "publicações"}
          </h2>

          {articles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-hairline bg-white/60 px-6 py-14 text-center text-sm text-ink-3">
              Este colunista ainda não publicou por aqui.
            </p>
          ) : (
            articles.map((article) => (
              <ListRow key={article.slug} article={article} showStandfirst />
            ))
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <NewsletterWidget />
          <AdSlot slot="colunista-sidebar" />
        </aside>
      </div>
    </div>
  );
}
