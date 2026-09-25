import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticle, getArticleBody, getArticles, getAuthor } from "@/lib/data";
import BlockRenderer from "@/components/article/BlockRenderer";
import { CategoryBadge, TierBadge } from "@/components/ui/Badge";
import { ListRow } from "@/components/portal/ArticleCard";
import {
  NewsletterWidget,
  MostReadWidget,
  AdSlot,
  ProWidget,
} from "@/components/portal/Sidebar";
import SectionHeading from "@/components/ui/SectionHeading";
import { formatDateLong } from "@/lib/format";

/**
 * Renderizada por requisição, não pré-gerada.
 *
 * O corpo vem de article_body_json, que aplica o direito de quem pede — uma
 * página estática congelaria a versão de um leitor e a serviria a todos.
 * O custo é perder o cache de borda; a alternativa desenhada na spec (casca
 * estática mais continuação buscada no cliente) fica para quando houver
 * volume que justifique.
 */
export const dynamic = "force-dynamic";

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
  const related = await getArticles({
    category: article.category,
    limit: 4,
    exclude: [article.slug],
  });

  // O corpo vem já cortado conforme o direito de quem pede: a função do banco
  // decide, e o trecho restrito nunca chega ao navegador de quem não tem
  // acesso. Nulo significa matéria sem corpo ainda — rascunho recém-criado
  // ou publicação sem texto.
  const body = await getArticleBody(slug);

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

          {/* A capa acompanha a medida do texto, não a da coluna.
              Antes ela ocupava a largura inteira e ficava mais larga do que a
              matéria que ilustra — o olho batia na foto e não no lede. Em
              jornal a imagem serve o texto; quando ela é maior que ele, a
              hierarquia se inverte sem ninguém ter decidido isso. */}
          <figure className="mt-7 max-w-[720px]">
            <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-forest-100">
              <Image
                src={article.image}
                alt={article.imageAlt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-xs leading-relaxed text-ink-4">
              {article.imageAlt}
            </figcaption>
          </figure>

          <div className="mt-8 max-w-[720px]">
            {body ? (
              <BlockRenderer doc={body} />
            ) : (
              <p className="text-[17px] leading-relaxed text-ink-3">
                Esta matéria ainda não tem corpo publicado.
              </p>
            )}
          </div>

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
