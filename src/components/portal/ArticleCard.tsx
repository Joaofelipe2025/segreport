import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { CategoryBadge, TierBadge } from "@/components/ui/Badge";
import { formatRelative } from "@/lib/format";

/**
 * Cartões de notícia em quatro densidades.
 *
 * A densidade é escolhida pela posição na página, não pelo conteúdo — a
 * mesma matéria aparece como manchete na home e como linha de lista na
 * página de categoria.
 */

/** Manchete principal: imagem grande com texto sobreposto. */
export function LeadCard({ article }: { article: Article }) {
  return (
    <article className="group relative overflow-hidden rounded-xl bg-forest-800">
      <Link href={`/noticias/${article.slug}`} className="block">
        <div className="relative aspect-[16/11] sm:aspect-[16/10]">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          {/* Gradiente garante contraste do texto sobre qualquer foto */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/55 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CategoryBadge category={article.category} onDark href={false} />
            {article.minTier && <TierBadge tier={article.minTier} />}
          </div>
          <h2 className="text-balance text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-white sm:text-[32px] lg:text-[38px]">
            {article.title}
          </h2>
          <p className="clamp-2 mt-3 max-w-2xl text-sm leading-relaxed text-forest-200 sm:text-base">
            {article.standfirst}
          </p>
        </div>
      </Link>
    </article>
  );
}

/**
 * Destaque secundário: imagem com texto sobreposto, formato compacto.
 *
 * `priority` existe porque em telas estreitas a vitrine empilha e o primeiro
 * destaque secundário pode ser o maior elemento da dobra — sem prioridade,
 * ele entra na fila normal e atrasa o LCP.
 */
export function OverlayCard({
  article,
  priority = false,
}: {
  article: Article;
  priority?: boolean;
}) {
  return (
    <article className="group relative flex-1 overflow-hidden rounded-xl bg-forest-800">
      <Link href={`/noticias/${article.slug}`} className="block h-full">
        <div className="relative h-full min-h-[180px]">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/50 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <CategoryBadge category={article.category} onDark href={false} />
          <h3 className="mt-2.5 text-balance text-base font-bold leading-[1.25] text-white lg:text-lg">
            {article.title}
          </h3>
          <p className="clamp-1 mt-1.5 text-xs text-forest-200">
            {article.standfirst}
          </p>
        </div>
      </Link>
    </article>
  );
}

/** Cartão de faixa: imagem em cima, texto embaixo, fundo de papel. */
export function StripCard({ article }: { article: Article }) {
  return (
    <article className="group">
      <Link href={`/noticias/${article.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-forest-100">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            sizes="(max-width: 640px) 50vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
          <div className="absolute left-2.5 top-2.5">
            <CategoryBadge category={article.category} onDark href={false} />
          </div>
        </div>
        <h3 className="clamp-3 mt-3 text-balance text-sm font-bold leading-[1.35] text-ink group-hover:text-forest-700 lg:text-[15px]">
          {article.title}
        </h3>
        <p className="clamp-2 mt-1.5 text-[13px] leading-relaxed text-ink-3">
          {article.standfirst}
        </p>
      </Link>
    </article>
  );
}

/** Linha de lista: miniatura à esquerda, título à direita. */
export function ListRow({
  article,
  showStandfirst = false,
}: {
  article: Article;
  showStandfirst?: boolean;
}) {
  return (
    <article className="group border-b border-hairline py-4 last:border-0">
      <Link href={`/noticias/${article.slug}`} className="flex items-start gap-4">
        <div className="relative h-[68px] w-[100px] shrink-0 overflow-hidden rounded-md bg-forest-100 sm:h-[76px] sm:w-[116px]">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            sizes="116px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <CategoryBadge category={article.category} onDark={false} href={false} />
            {article.minTier && <TierBadge tier={article.minTier} />}
          </div>
          <h3 className="clamp-2 text-balance text-[15px] font-bold leading-[1.3] text-ink transition-colors group-hover:text-forest-700 sm:text-base">
            {article.title}
          </h3>
          {showStandfirst && (
            <p className="clamp-2 mt-1.5 text-[13px] leading-relaxed text-ink-3">
              {article.standfirst}
            </p>
          )}
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-4">
            {formatRelative(article.publishedAt)} · {article.readingMinutes} min
          </p>
        </div>
      </Link>
    </article>
  );
}

/** Título puro, sem imagem — usado na coluna de mais lidas. */
export function RankedRow({
  article,
  position,
}: {
  article: Article;
  position: number;
}) {
  return (
    <li className="border-b border-hairline py-3.5 last:border-0">
      <Link href={`/noticias/${article.slug}`} className="group flex gap-3.5">
        <span className="font-mono text-xl font-medium leading-none text-ink-4 transition-colors group-hover:text-forest-600">
          {position}
        </span>
        <div className="min-w-0">
          <h3 className="clamp-3 text-[14px] font-semibold leading-[1.35] text-ink transition-colors group-hover:text-forest-700">
            {article.title}
          </h3>
          <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-4">
            {article.category}
          </p>
        </div>
      </Link>
    </li>
  );
}
