import Link from "next/link";
import { getCurrentTier, getIndicators } from "@/lib/data";
import { formatIndicator, formatDelta, formatMonthYear, trendOf } from "@/lib/format";
import { CURRENT_PERIOD } from "@/lib/data/indicators";
import { BRANCH_LABELS } from "@/lib/categories";

/**
 * Faixa "Temperatura do Mercado" — a ponte entre o portal e o Hub.
 *
 * Fica logo abaixo da dobra por decisão de design: no protótipo o Hub só
 * existia atrás de um botão no menu, de modo que quem chegava pelo Google
 * numa matéria nunca descobria que havia dado exclusivo. Aqui todo leitor
 * esbarra uma vez no número antes de continuar lendo.
 *
 * Mostra apenas os seis indicadores de prêmio, todos de nível gratuito: a
 * faixa é vitrine, não produto. O que é restrito aparece só dentro do Hub.
 */
export default async function MarketStrip() {
  const tier = await getCurrentTier();
  const indicators = await getIndicators(tier);

  const branchCards = indicators.filter(
    ({ definition }) => definition.minTier === "free"
  );

  return (
    <section className="rounded-xl bg-gradient-to-br from-forest-800 to-forest-900 px-4 py-5 text-white ring-1 ring-white/8 sm:px-7 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-lime-400">
            <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-lime-400" />
            Temperatura do Mercado
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
            Seis ramos, <span className="capitalize">{formatMonthYear(CURRENT_PERIOD)}</span>
          </h2>
        </div>

        <Link
          href="/hub/indicadores"
          className="group inline-flex items-center gap-2 rounded-full bg-lime-400 px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.04em] text-forest-800 transition-colors hover:bg-lime-500"
        >
          Ver no Hub
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M3 8h9M8.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Grade travada: seis colunas em telas largas, alturas iguais.
          É a disciplina que impede os cards escuros de virarem ilhas soltas. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {branchCards.map(({ definition, value, deltaPp }) => {
          const trend = trendOf(deltaPp);
          return (
            <Link
              key={definition.key}
              href="/hub/indicadores"
              className="flex min-h-[104px] flex-col justify-between rounded-lg bg-forest-700 p-3.5 transition-colors hover:bg-forest-600"
            >
              <p className="text-[11px] font-semibold text-forest-300">
                {BRANCH_LABELS[definition.branch]}
              </p>
              <div>
                <p className="font-mono text-2xl font-bold leading-none tracking-[-0.02em] text-lime-400">
                  {formatIndicator(value, definition.unit)}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                  <span
                    className={
                      trend === "up"
                        ? "text-up"
                        : trend === "down"
                          ? "text-down"
                          : "text-forest-300"
                    }
                  >
                    {formatDelta(deltaPp)}
                  </span>
                  <span className="text-forest-500">{definition.window}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-forest-500">
        Fonte: SUSEP e ANS · Dado fechado de{" "}
        <span className="capitalize">{formatMonthYear(CURRENT_PERIOD)}</span>. Sinistralidade,
        market share e série histórica de 5 anos estão no Hub Inteligência.
      </p>
    </section>
  );
}
