import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticle, getArticles, getAuthor, getCurrentTier } from "@/lib/data";
import { ARTICLES } from "@/lib/data/articles";
import { CategoryBadge, TierBadge, LockIcon } from "@/components/ui/Badge";
import { ListRow } from "@/components/portal/ArticleCard";
import {
  NewsletterWidget,
  MostReadWidget,
  AdSlot,
  ProWidget,
} from "@/components/portal/Sidebar";
import SectionHeading from "@/components/ui/SectionHeading";
import { formatDateLong } from "@/lib/format";
import { canAccess, PRO_BENEFITS } from "@/lib/tier";

/** Pré-gera as matérias no build — HTML estático, indexável e rápido. */
export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata(
  props: PageProps<"/noticias/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticle(slug);
  if (!article) return { title: "Matéria não encontrada" };

  return {
    title: article.title,
    description: article.standfirst,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.standfirst,
      publishedTime: article.publishedAt,
      images: [{ url: article.image }],
    },
  };
}

export default async function ArticlePage(props: PageProps<"/noticias/[slug]">) {
  const { slug } = await props.params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const author = await getAuthor(article.authorSlug);
  const tier = await getCurrentTier();
  const related = await getArticles({
    category: article.category,
    limit: 4,
    exclude: [article.slug],
  });

  // Análise restrita: o leitor Free recebe a abertura real e um bloco que
  // nomeia o que falta. O corpo restante não é enviado ao navegador.
  const locked = !canAccess(tier, article.minTier ?? "free");
  const body = locked ? article.body.slice(0, 1) : article.body;

  return (
    <article className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <nav aria-label="Trilha" className="mb-5 text-xs font-medium text-ink-3">
        <Link href="/" className="hover:text-forest-700">
          Home
        </Link>
        <span className="mx-2 text-ink-4">/</span>
        <Link href={`/${article.category}`} className="hover:text-forest-700">
          {article.category}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="min-w-0">
          <header className="max-w-[760px]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <CategoryBadge category={article.category} />
              {article.minTier && <TierBadge tier={article.minTier} />}
            </div>

            <h1 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.025em] text-ink sm:text-[42px]">
              {article.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-ink-2 sm:text-xl">
              {article.standfirst}
            </p>

            {author && (
              <div className="mt-6 flex items-center gap-3 border-y border-hairline py-4">
                <Image
                  src={author.avatar}
                  alt=""
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
                <div className="text-sm">
                  <p className="font-semibold text-ink">
                    {author.columnist ? (
                      <Link href={`/colunistas/${author.slug}`} className="hover:text-forest-700">
                        {author.name}
                      </Link>
                    ) : (
                      author.name
                    )}
                  </p>
                  <p className="text-xs text-ink-3">
                    {formatDateLong(article.publishedAt)} · {article.readingMinutes} min de leitura
                  </p>
                </div>
              </div>
            )}
          </header>

          <figure className="mt-7">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-forest-100">
              <Image
                src={article.image}
                alt={article.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-xs text-ink-4">
              {article.imageAlt}
            </figcaption>
          </figure>

          <div className="mt-8 max-w-[720px] space-y-5 text-[17px] leading-[1.75] text-ink-2">
            {body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {locked && <ArticlePaywall />}

          {!locked && article.tags.length > 0 && (
            <div className="mt-9 flex max-w-[720px] flex-wrap gap-2 border-t border-hairline pt-6">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-forest-100 px-3 py-1.5 text-xs font-semibold text-forest-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-14">
              <SectionHeading title="Relacionadas" href={`/${article.category}`} />
              <div className="grid gap-x-8 md:grid-cols-2">
                {related.map((item) => (
                  <ListRow key={item.slug} article={item} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <AdSlot slot="article-sidebar-1" />
          <NewsletterWidget />
          <MostReadWidget />
          <ProWidget />
        </aside>
      </div>
    </article>
  );
}

/**
 * Bloqueio de matéria restrita.
 *
 * Segue a decisão de "amostra honesta": a abertura é real e indexável, e o
 * bloco lista item a item o que o assinante recebe. Nada de desfocar texto —
 * texto borrado com CSS continua legível no código-fonte da página.
 */
function ArticlePaywall() {
  return (
    <section className="mt-2 max-w-[720px] rounded-xl bg-forest-800 p-6 text-white sm:p-8">
      <div className="flex items-center gap-2 text-lime-400">
        <LockIcon className="h-4 w-4" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
          Análise exclusiva PRO
        </p>
      </div>

      <h2 className="mt-3 text-xl font-bold leading-snug sm:text-2xl">
        Continue lendo com o Hub Inteligência
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-forest-200">
        Esta análise segue com a leitura dos números por trás do movimento.
        Assine para ler na íntegra e destravar:
      </p>

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {PRO_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex gap-2.5 text-sm text-forest-200">
            <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="m3 8.5 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/premium"
          className="rounded-full bg-lime-400 px-6 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500"
        >
          Assinar PRO
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.06em] transition-colors hover:border-lime-400"
        >
          Já sou assinante
        </Link>
      </div>
    </section>
  );
}
