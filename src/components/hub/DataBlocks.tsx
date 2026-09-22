import Link from "next/link";
import type { IndicatorDefinition, IndicatorValue } from "@/lib/types";
import { formatIndicator, formatDelta, formatMonthYear, trendOf } from "@/lib/format";
import { LockIcon } from "@/components/ui/Badge";
import { PRO_BENEFITS } from "@/lib/tier";

/**
 * Blocos de dado do Hub.
 *
 * Todos compartilham `min-h` por família. No tratamento híbrido — cards
 * escuros sobre página clara — blocos de alturas diferentes viram ilhas
 * soltas e abrem o vão branco que aparece no protótipo. Altura travada por
 * linha faz os blocos formarem faixas alinhadas.
 */

const CARD = "rounded-xl bg-forest-800 text-white";
const CARD_MIN = "min-h-[148px]";

/** Cartão de indicador com valor liberado. */
export function KpiCard({
  definition,
  value,
  deltaPp,
  period,
}: {
  definition: IndicatorDefinition;
  value: number | null;
  deltaPp: number | null;
  period: string;
}) {
  const trend = trendOf(deltaPp);

  return (
    <article className={`${CARD} ${CARD_MIN} flex flex-col justify-between p-5`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-forest-200">{definition.label}</p>
        <span className="shrink-0 rounded bg-forest-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-forest-300">
          {definition.window}
        </span>
      </div>

      <div>
        <p className="font-mono text-[34px] font-bold leading-none tracking-[-0.03em] text-lime-400">
          {formatIndicator(value, definition.unit)}
        </p>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={`font-semibold ${
              trend === "up" ? "text-up" : trend === "down" ? "text-down" : "text-forest-300"
            }`}
          >
            {formatDelta(deltaPp)}
          </span>
          <span className="text-forest-500">vs. período anterior</span>
        </div>

        <p className="mt-2.5 truncate text-[10px] text-forest-500" title={definition.source}>
          {definition.source} · <span className="capitalize">{formatMonthYear(period)}</span>
        </p>
      </div>
    </article>
  );
}

/**
 * Cartão de indicador restrito.
 *
 * O rótulo, o ramo e a fonte são públicos; o número nunca chega ao navegador
 * — a camada de dados devolve `null`. O que o cartão faz é nomear o que está
 * faltando, que converte melhor do que borrar um valor.
 */
export function LockedKpiCard({ definition }: { definition: IndicatorDefinition }) {
  return (
    <article
      className={`${CARD_MIN} flex flex-col justify-between rounded-xl border border-dashed border-lime-400/35 bg-forest-800/90 p-5 text-white`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-forest-200">{definition.label}</p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-lime-400/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-lime-400">
          <LockIcon className="h-2.5 w-2.5" />
          {definition.minTier === "corporate" ? "Corporate" : "PRO"}
        </span>
      </div>

      <div>
        <p className="font-mono text-[34px] font-bold leading-none tracking-[-0.03em] text-forest-600">
          ———
        </p>
        <Link
          href="/premium"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-lime-400 transition-colors hover:text-lime-300"
        >
          Liberar indicador
          <span aria-hidden="true">→</span>
        </Link>
        <p className="mt-2.5 truncate text-[10px] text-forest-500">{definition.source}</p>
      </div>
    </article>
  );
}

/**
 * Gráfico de série temporal em colunas.
 *
 * SVG puro, sem biblioteca: são até 24 pontos e uma escala linear, então
 * trazer uma dependência de gráfico custaria mais em bundle do que entrega
 * em recurso. Renderiza no servidor, sem JavaScript no cliente.
 */
export function SeriesChart({
  series,
  label,
  unit,
}: {
  series: IndicatorValue[];
  label: string;
  unit: IndicatorDefinition["unit"];
}) {
  if (series.length === 0) {
    return (
      <div className={`${CARD} flex min-h-[260px] items-center justify-center p-6`}>
        <p className="text-sm text-forest-300">
          Série histórica disponível para assinantes PRO.
        </p>
      </div>
    );
  }

  const values = series.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  // Respiro de 12% acima e abaixo para a coluna mais alta não encostar no topo.
  const floor = min - span * 0.12;
  const ceiling = max + span * 0.12;
  const range = ceiling - floor;

  return (
    <section className={`${CARD} p-5 sm:p-6`}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold">Evolução Temporal</h3>
        <p className="text-xs text-forest-300">
          {label} · últimos {series.length} meses
        </p>
      </div>

      <div className="flex h-[200px] items-end gap-[3px]" role="img" aria-label={`Série de ${label}`}>
        {series.map((point, index) => {
          const height = ((point.value - floor) / range) * 100;
          const isLast = index >= series.length - 3;
          return (
            <div
              key={point.period}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              <div
                className={`absolute bottom-0 w-full rounded-t-[2px] transition-colors ${
                  isLast ? "bg-lime-400" : "bg-forest-600 group-hover:bg-forest-500"
                }`}
                style={{ height: `${height}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-forest-900 px-2 py-1 font-mono text-[10px] text-lime-400 group-hover:block">
                {formatIndicator(point.value, unit)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase text-forest-500">
        <span className="capitalize">{formatMonthYear(series[0].period)}</span>
        <span className="capitalize">
          {formatMonthYear(series[series.length - 1].period)}
        </span>
      </div>
    </section>
  );
}

/**
 * Bloco de conversão.
 *
 * Aparece onde o dado foi cortado, listando item a item o que o assinante
 * recebe. É a "amostra honesta": o leitor viu dado real acima e sabe
 * exatamente o que está do outro lado.
 */
export function UpsellBlock({
  headline,
  detail,
  compact = false,
}: {
  headline: string;
  detail?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-lime-400/40 bg-forest-800 text-white ${
        compact ? "p-5" : "p-6 sm:p-7"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-lime-400">
            <LockIcon className="h-3 w-3" />
            Exclusivo para assinantes
          </p>
          <h3 className="mt-2.5 text-lg font-bold leading-snug">{headline}</h3>
          {detail && (
            <p className="mt-1.5 text-sm leading-relaxed text-forest-200">{detail}</p>
          )}

          {!compact && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {PRO_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex gap-2 text-[13px] text-forest-200">
                  <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="m3 8.5 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/premium"
          className="shrink-0 rounded-full bg-lime-400 px-6 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500"
        >
          Assinar PRO
        </Link>
      </div>
    </div>
  );
}

/** Painel escuro genérico, usado para listas e tabelas do Hub. */
export function DataPanel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${CARD} overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <h3 className="text-base font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
