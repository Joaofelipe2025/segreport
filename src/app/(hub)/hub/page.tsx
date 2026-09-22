import Link from "next/link";
import Image from "next/image";
import {
  getCurrentTier,
  getIndicators,
  getArticles,
  getRadarSignals,
} from "@/lib/data";
import { CURRENT_PERIOD } from "@/lib/data/indicators";
import {
  KpiCard,
  LockedKpiCard,
  DataPanel,
  UpsellBlock,
} from "@/components/hub/DataBlocks";
import { ImpactBadge, CategoryBadge } from "@/components/ui/Badge";
import { formatRelative, formatDateShort, formatMonthYear } from "@/lib/format";

export default async function HubDashboard() {
  const tier = await getCurrentTier();
  const indicators = await getIndicators(tier);
  const articles = await getArticles({ limit: 4 });
  const { signals, hiddenCount } = await getRadarSignals(tier, 4);

  const open = indicators.filter((i) => !i.locked);
  const locked = indicators.filter((i) => i.locked);

  return (
    <div className="space-y-10 lg:space-y-12">
      {/* ---- Indicadores ---------------------------------------------------- */}
      <section>
        <SectionBar
          title="Indicadores do Mercado"
          meta={formatMonthYear(CURRENT_PERIOD)}
          href="/hub/indicadores"
          linkLabel="Todos os indicadores"
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {open.map(({ definition, value, deltaPp, series }) => (
            <KpiCard
              key={definition.key}
              definition={definition}
              value={value}
              deltaPp={deltaPp}
              series={series}
              period={CURRENT_PERIOD}
            />
          ))}
        </div>

        {locked.length > 0 && (
          <>
            <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">
              Disponíveis para assinantes
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {locked.map(({ definition }) => (
                <LockedKpiCard key={definition.key} definition={definition} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ---- Acesso rápido -------------------------------------------------- */}
      <section>
        <SectionBar title="Acesso Rápido" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <QuickCard
            href="/hub/indicadores"
            title="Indicadores"
            subtitle="Painéis por ramo"
            icon={<TrendIcon />}
          />
          <QuickCard
            href="/hub/rankings"
            title="Rankings"
            subtitle="Top 20 seguradoras"
            icon={<BarsIcon />}
          />
          <QuickCard
            href="/hub/radar"
            title="Radar"
            subtitle="Tendências emergentes"
            icon={<RadarIcon />}
          />
          <QuickCard
            href="/hub/relatorios"
            title="Relatórios"
            subtitle="Biblioteca completa"
            icon={<DocIcon />}
          />
        </div>
      </section>

      {/* ---- Notícias + sinais ---------------------------------------------- */}
      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <DataPanel
          title="Últimas Notícias"
          action={
            <Link
              href="/noticias"
              className="shrink-0 text-xs font-semibold text-lime-400 transition-colors hover:text-lime-300"
            >
              Ver todas →
            </Link>
          }
        >
          <ul className="divide-y divide-white/[0.06]">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/noticias/${article.slug}`}
                  className="flex items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-white/[0.04] sm:gap-4 sm:px-6"
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-forest-700 sm:h-16 sm:w-24">
                    <Image
                      src={article.image}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <CategoryBadge category={article.category} onDark href={false} />
                    <h4 className="clamp-2 mt-1.5 text-[13px] font-semibold leading-snug text-white sm:text-sm">
                      {article.title}
                    </h4>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-forest-500">
                      {formatRelative(article.publishedAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </DataPanel>

        <DataPanel
          title="Sinais de Tendência"
          action={
            <Link
              href="/hub/radar"
              className="shrink-0 text-xs font-semibold text-lime-400 transition-colors hover:text-lime-300"
            >
              Ver radar →
            </Link>
          }
        >
          <ul className="divide-y divide-white/[0.06]">
            {signals.map((signal) => (
              <li
                key={signal.id}
                className="px-4 py-3.5 transition-colors hover:bg-white/[0.04] sm:px-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-forest-400">
                    {signal.category}
                  </p>
                  <ImpactBadge impact={signal.impact} />
                </div>
                <h4 className="mt-1.5 text-[13px] font-semibold leading-snug text-white sm:text-sm">
                  {signal.title}
                </h4>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-forest-500">
                  {formatDateShort(signal.date)}
                </p>
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && (
            <div className="border-t border-white/8 px-4 py-3.5 sm:px-6">
              <p className="text-xs text-forest-300">
                Mais <strong className="text-lime-400">{hiddenCount}</strong>{" "}
                {hiddenCount === 1 ? "sinal monitorado" : "sinais monitorados"} no
                plano PRO.
              </p>
            </div>
          )}
        </DataPanel>
      </section>

      {tier === "free" && (
        <UpsellBlock
          headline="Você está vendo a versão aberta do Hub Inteligência"
          detail="Sinistralidade, Top 20 completo dos rankings e série histórica de cinco anos ficam disponíveis no plano PRO."
        />
      )}
    </div>
  );
}

/**
 * Cabeçalho de seção do Hub.
 *
 * Mais discreto que o do portal: aqui o dado é o protagonista, e título com
 * o mesmo peso da home roubaria a hierarquia dos números.
 */
function SectionBar({
  title,
  meta,
  href,
  linkLabel,
}: {
  title: string;
  meta?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-ink sm:text-lg">
          {title}
        </h2>
        {meta && (
          <span className="font-mono text-[11px] capitalize text-ink-4">{meta}</span>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="group text-xs font-semibold text-ink-3 transition-colors hover:text-forest-700"
        >
          {linkLabel}
          <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
    </div>
  );
}

function QuickCard({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[104px] flex-col justify-between rounded-xl border border-hairline bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-500/40 hover:shadow-[0_12px_28px_rgba(14,31,20,0.10)] sm:min-h-[116px] sm:p-5"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-100 text-forest-700 transition-colors group-hover:bg-forest-800 group-hover:text-lime-400">
        {icon}
      </span>
      <div className="mt-3">
        <p className="text-[15px] font-semibold leading-tight text-ink">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-ink-3">{subtitle}</p>
      </div>
    </Link>
  );
}

const S = {
  className: "h-[18px] w-[18px]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  "aria-hidden": true,
} as const;

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M4 16 10 10l3.5 3.5L20 7M15 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M5 20V11M12 20V4M19 20v-6" strokeLinecap="round" />
    </svg>
  );
}
function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M6 3h8l4 4v14H6z" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  );
}
