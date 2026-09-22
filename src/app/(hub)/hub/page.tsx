import Link from "next/link";
import Image from "next/image";
import {
  getCurrentTier,
  getIndicators,
  getArticles,
  getRadarSignals,
} from "@/lib/data";
import { CURRENT_PERIOD } from "@/lib/data/indicators";
import { KpiCard, LockedKpiCard, DataPanel, UpsellBlock } from "@/components/hub/DataBlocks";
import { ImpactBadge, CategoryBadge } from "@/components/ui/Badge";
import SectionHeading from "@/components/ui/SectionHeading";
import { formatRelative, formatDateShort } from "@/lib/format";

export default async function HubDashboard() {
  const tier = await getCurrentTier();
  const indicators = await getIndicators(tier);
  const articles = await getArticles({ limit: 4 });
  const { signals, hiddenCount } = await getRadarSignals(tier, 4);

  const freeIndicators = indicators.filter((i) => !i.locked);
  const lockedIndicators = indicators.filter((i) => i.locked);

  return (
    <div className="space-y-10">
      {/* ---- Indicadores do mercado ---------------------------------------- */}
      <section>
        <SectionHeading title="Indicadores do Mercado" href="/hub/indicadores" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {freeIndicators.map(({ definition, value, deltaPp }) => (
            <KpiCard
              key={definition.key}
              definition={definition}
              value={value}
              deltaPp={deltaPp}
              period={CURRENT_PERIOD}
            />
          ))}
        </div>

        {lockedIndicators.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lockedIndicators.map(({ definition }) => (
              <LockedKpiCard key={definition.key} definition={definition} />
            ))}
          </div>
        )}
      </section>

      {/* ---- Acesso rápido -------------------------------------------------- */}
      <section>
        <SectionHeading title="Acesso Rápido" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <QuickCard
            href="/hub/indicadores"
            title="Indicadores"
            subtitle="Painéis por categoria"
          />
          <QuickCard
            href="/hub/rankings"
            title="Rankings 2026"
            subtitle="Top seguradoras"
          />
          <QuickCard href="/hub/radar" title="Radar" subtitle="Tendências emergentes" />
          <QuickCard
            href="/hub/relatorios"
            title="Relatórios"
            subtitle="Biblioteca completa"
          />
        </div>
      </section>

      {/* ---- Notícias + sinais --------------------------------------------- */}
      <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <DataPanel
          title="Últimas Notícias"
          action={
            <Link href="/noticias" className="text-xs font-semibold text-lime-400 hover:text-lime-300">
              Ver todas →
            </Link>
          }
        >
          <ul className="divide-y divide-white/8">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/noticias/${article.slug}`}
                  className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-forest-700 sm:px-6"
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-forest-700">
                    <Image
                      src={article.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <CategoryBadge category={article.category} onDark href={false} />
                    <h4 className="clamp-2 mt-1.5 text-sm font-semibold leading-snug text-white">
                      {article.title}
                    </h4>
                    <p className="mt-1 font-mono text-[10px] uppercase text-forest-500">
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
            <Link href="/hub/radar" className="text-xs font-semibold text-lime-400 hover:text-lime-300">
              Ver radar →
            </Link>
          }
        >
          <ul className="divide-y divide-white/8">
            {signals.map((signal) => (
              <li key={signal.id} className="px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-300">
                    {signal.category}
                  </p>
                  <ImpactBadge impact={signal.impact} />
                </div>
                <h4 className="mt-2 text-sm font-semibold leading-snug text-white">
                  {signal.title}
                </h4>
                <p className="mt-1 font-mono text-[10px] uppercase text-forest-500">
                  {formatDateShort(signal.date)}
                </p>
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && (
            <div className="border-t border-white/10 px-5 py-4 sm:px-6">
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
          detail="Os indicadores de sinistralidade, o Top 20 completo dos rankings e a série histórica de cinco anos ficam disponíveis no plano PRO."
        />
      )}
    </div>
  );
}

function QuickCard({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[112px] flex-col justify-between rounded-xl border border-hairline bg-white p-5 transition-all hover:border-forest-500 hover:shadow-[0_10px_28px_rgba(14,31,20,0.09)]"
    >
      <span className="text-forest-700 transition-transform group-hover:-translate-y-0.5">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 16 10 10l3.5 3.5L20 7M15 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <p className="text-base font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>
      </div>
    </Link>
  );
}
