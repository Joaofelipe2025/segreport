import Image from "next/image";
import Link from "next/link";
import {
  getArticles,
  getFeatured,
  getFlashPosts,
} from "@/lib/data";
import {
  LeadCard,
  OverlayCard,
  StripCard,
  ListRow,
} from "@/components/portal/ArticleCard";
import MarketStrip from "@/components/portal/MarketStrip";
import {
  NewsletterWidget,
  MostReadWidget,
  ProWidget,
  AdSlot,
} from "@/components/portal/Sidebar";
import SectionHeading from "@/components/ui/SectionHeading";
import { CategoryBadge } from "@/components/ui/Badge";
import { formatDateShort } from "@/lib/format";
import type { Article, CategorySlug } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";

export default async function HomePage() {
  const { lead, secondary, strip } = await getFeatured();
  const latest = await getArticles({
    limit: 5,
    exclude: [lead.slug, ...secondary.map((a) => a.slug)],
  });
  const saude = await getArticles({ category: "saude", limit: 3 });
  const auto = await getArticles({ category: "auto", limit: 3 });
  const flash = await getFlashPosts(4);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:py-6 lg:px-8 lg:py-8">
      {/* ---- Vitrine: manchete + dois destaques ---------------------------- */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-[2fr_1fr]">
        <LeadCard article={lead} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {secondary.map((article, index) => (
            <OverlayCard
              key={article.slug}
              article={article}
              priority={index === 0}
            />
          ))}
        </div>
      </section>

      {/* ---- Faixa de cinco cartões ---------------------------------------- */}
      <section className="mt-7 grid grid-cols-2 gap-4 sm:mt-8 sm:gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {strip.map((article) => (
          <StripCard key={article.slug} article={article} />
        ))}
      </section>

      {/* ---- Temperatura do mercado: a ponte para o Hub --------------------- */}
      <div className="mt-10">
        <MarketStrip />
      </div>

      {/* ---- Corpo editorial + coluna lateral ------------------------------ */}
      <div className="mt-10 grid gap-9 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="min-w-0">
          <section>
            <SectionHeading title="Últimas Notícias" href="/noticias" />
            <div>
              {latest.map((article) => (
                <ListRow key={article.slug} article={article} />
              ))}
            </div>
          </section>

          <CategorySection slug="saude" articles={saude} />
          <CategorySection slug="auto" articles={auto} />

          {/* ---- Flash do Mercado ------------------------------------------ */}
          <section className="mt-12">
            <SectionHeading
              title="Flash do Mercado"
              href="/flash"
              linkLabel="Ver todas"
              icon={<CameraIcon />}
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {flash.map((post) => (
                <Link
                  key={post.slug}
                  href={`/flash/${post.slug}`}
                  className="group relative overflow-hidden rounded-lg bg-forest-800"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={post.cover}
                      alt={post.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/30 to-transparent" />
                  </div>

                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded bg-lime-400 px-2 py-1 text-[10px] font-extrabold text-forest-800">
                    <CameraIcon className="h-3 w-3" />
                    {post.photoCount}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-3.5">
                    <h3 className="clamp-2 text-sm font-bold leading-tight text-white">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-forest-300">
                      {post.venue} · {formatDateShort(post.date)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ---- Coluna lateral --------------------------------------------- */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <NewsletterWidget />
          <MostReadWidget />
          <AdSlot slot="home-sidebar-1" />
          <ProWidget />
        </aside>
      </div>
    </div>
  );
}

/**
 * Bloco de categoria: um destaque grande à esquerda, duas chamadas à direita.
 * Repete o padrão do protótipo para Saúde e Auto.
 */
function CategorySection({
  slug,
  articles,
}: {
  slug: CategorySlug;
  articles: Article[];
}) {
  if (articles.length === 0) return null;
  const [featured, ...rest] = articles;

  return (
    <section className="mt-12">
      <SectionHeading title={categoryLabel(slug)} href={`/${slug}`} />

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Link href={`/noticias/${featured.slug}`} className="group">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-forest-100">
            <Image
              src={featured.image}
              alt={featured.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute left-2.5 top-2.5">
              <CategoryBadge category={featured.category} onDark href={false} />
            </div>
          </div>
          <h3 className="clamp-2 mt-3 text-balance text-lg font-bold leading-snug text-ink transition-colors group-hover:text-forest-700">
            {featured.title}
          </h3>
          <p className="clamp-2 mt-2 text-sm leading-relaxed text-ink-3">
            {featured.standfirst}
          </p>
        </Link>

        <div>
          {rest.map((article) => (
            <ListRow key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CameraIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9.4 4h5.2l1.1 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.3zM12 9.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5" />
    </svg>
  );
}
