import Link from "next/link";
import type { IndicatorDefinition, IndicatorValue } from "@/lib/types";
import { formatIndicator, formatDelta, formatMonthYear, trendOf } from "@/lib/format";
import { LockIcon } from "@/components/ui/Badge";
import { PRO_BENEFITS } from "@/lib/tier";
import Sparkline from "./Sparkline";

/**
 * Blocos de dado do Hub.
 *
 * Duas regras de composição sustentam o tratamento híbrido — blocos escuros
 * sobre página clara:
 *
 * 1. ALTURA TRAVADA por família. Blocos de alturas diferentes viram ilhas
 *    soltas e abrem o vão branco que aparece no protótipo.
 * 2. SUPERFÍCIE COM PROFUNDIDADE. Cor chapada sobre fundo claro lê como
 *    retângulo colado. Gradiente sutil mais anel de 1px dão a sensação de
 *    peça apoiada na página.
 */

/** Superfície padrão dos blocos escuros. */
const SURFACE =
  "rounded-xl bg-gradient-to-br from-forest-800 to-forest-900 text-white ring-1 ring-white/8";

/** Cartão de indicador com valor liberado. */
export function KpiCard({
  definition,
  value,
  deltaPp,
  period,
  series = [],
}: {
  definition: IndicatorDefinition;
  value: number | null;
  deltaPp: number | null;
  period: string;
  series?: number[];
}) {
  const trend = trendOf(deltaPp);

  const trendStyles =
    trend === "up"
      ? "bg-up/15 text-up"
      : trend === "down"
        ? "bg-down/15 text-down"
        : "bg-white/8 text-forest-300";

  return (
    <article
      className={`${SURFACE} group relative flex min-h-[172px] flex-col justify-between overflow-hidden p-4 transition-all duration-300 hover:ring-lime-400/30 sm:p-5`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold leading-snug text-forest-200">
          {definition.label}
        </p>
        <span className="shrink-0 rounded bg-white/8 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-forest-300">
          {definition.window}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-end gap-2">
          <p className="font-mono text-[30px] font-bold leading-none tracking-[-0.035em] text-lime-400 tabular-nums sm:text-[34px]">
            {formatIndicator(value, definition.unit)}
          </p>
          <span
            className={`mb-0.5 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${trendStyles}`}
          >
            <TrendGlyph trend={trend} />
            {formatDelta(deltaPp)}
          </span>
        </div>

        {series.length > 1 && (
          <div className="mt-3 -mx-1 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
            <Sparkline values={series} />
          </div>
        )}

        <p
          className="mt-2.5 truncate text-[10px] leading-relaxed text-forest-500"
          title={`${definition.source} · ${formatMonthYear(period)}`}
        >
          {definition.source}
        </p>
      </div>
    </article>
  );
}

/**
 * Cartão de indicador restrito.
 *
 * O rótulo, o ramo e a fonte são públicos; o número nunca chega ao navegador
 * — a camada de dados devolve `null`. O cartão nomeia o que está faltando,
 * que converte melhor do que borrar um valor.
 */
export function LockedKpiCard({ definition }: { definition: IndicatorDefinition }) {
  return (
    <Link
      href="/premium"
      className="group relative flex min-h-[172px] flex-col justify-between overflow-hidden rounded-xl bg-forest-800/70 p-4 text-white ring-1 ring-inset ring-dashed ring-lime-400/25 transition-all duration-300 hover:bg-forest-800 hover:ring-lime-400/50 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold leading-snug text-forest-300">
          {definition.label}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-lime-400/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-lime-400">
          <LockIcon className="h-2 w-2" />
          {definition.minTier === "corporate" ? "Corp" : "PRO"}
        </span>
      </div>

      <div className="mt-3">
        {/* Traços no lugar do número: sinaliza dado existente e indisponível,
            sem sugerir zero nem expor o valor real. */}
        <p className="font-mono text-[30px] font-bold leading-none tracking-[-0.035em] text-forest-600 sm:text-[34px]">
          ———
        </p>

        <div className="mt-3 flex h-7 items-center">
          <div className="h-px w-full bg-gradient-to-r from-lime-400/30 via-forest-600/40 to-transparent" />
        </div>

        <p className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-lime-400 transition-transform duration-300 group-hover:translate-x-0.5">
          Liberar indicador
          <span aria-hidden="true">→</span>
        </p>
      </div>
    </Link>
  );
}

/**
 * Gráfico de série temporal em área.
 *
 * A versão anterior usava colunas soltas, sem eixo nem grade — barra é forma
 * de comparar categorias, não de mostrar continuidade no tempo. Área com
 * linha de referência comunica a trajetória, que é o que o leitor quer ver.
 *
 * SVG gerado no servidor: são poucas dezenas de pontos e uma escala linear,
 * então uma biblioteca de gráfico custaria mais em peso do que entrega.
 */
export function SeriesChart({
  series,
  label,
  unit,
  source,
}: {
  series: IndicatorValue[];
  label: string;
  unit: IndicatorDefinition["unit"];
  source?: string;
}) {
  if (series.length < 2) {
    return (
      <section className={`${SURFACE} flex min-h-[280px] items-center justify-center p-6`}>
        <div className="max-w-xs text-center">
          <LockIcon className="mx-auto h-5 w-5 text-lime-400" />
          <p className="mt-3 text-sm font-semibold">Série histórica no plano PRO</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-forest-300">
            Assinantes acompanham 60 meses de evolução e exportam os dados.
          </p>
        </div>
      </section>
    );
  }

  const width = 1000;
  const height = 240;
  const padLeft = 44;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 28;

  const values = series.map((p) => p.value);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const spread = rawMax - rawMin || 1;
  const max = rawMax + spread * 0.15;
  const min = Math.max(0, rawMin - spread * 0.15);
  const range = max - min || 1;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const points = series.map((point, index) => {
    const x = padLeft + (index / (series.length - 1)) * plotW;
    const y = padTop + (1 - (point.value - min) / range) * plotH;
    return { x, y, point };
  });

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${padLeft + plotW},${padTop + plotH} L${padLeft},${padTop + plotH} Z`;

  // Quatro linhas de grade — o suficiente para dar referência sem poluir.
  const gridLines = [0, 1, 2, 3].map((i) => {
    const ratio = i / 3;
    return {
      y: padTop + ratio * plotH,
      value: max - ratio * range,
    };
  });

  // No máximo seis rótulos no eixo do tempo, para não sobrepor em tela estreita.
  const labelStep = Math.max(1, Math.ceil(series.length / 6));

  return (
    <section className={`${SURFACE} overflow-hidden`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/8 px-4 py-4 sm:px-6">
        <div>
          <h3 className="text-[15px] font-semibold">Evolução Temporal</h3>
          <p className="mt-0.5 text-xs text-forest-300">
            {label} · {series.length} meses
          </p>
        </div>
        {source && (
          <p className="font-mono text-[10px] uppercase tracking-wide text-forest-500">
            {source}
          </p>
        )}
      </div>

      <div className="px-2 py-4 sm:px-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[200px] w-full sm:h-[260px]"
          role="img"
          aria-label={`Evolução de ${label} ao longo de ${series.length} meses`}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-lime-400)" stopOpacity="0.30" />
              <stop offset="100%" stopColor="var(--color-lime-400)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grade e escala vertical */}
          {gridLines.map((grid) => (
            <g key={grid.y}>
              <line
                x1={padLeft}
                y1={grid.y}
                x2={width - padRight}
                y2={grid.y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-white/8"
              />
              <text
                x={padLeft - 8}
                y={grid.y + 4}
                textAnchor="end"
                className="fill-forest-500 font-mono text-[11px]"
              >
                {grid.value.toFixed(0)}
              </text>
            </g>
          ))}

          <path d={area} fill="url(#area-fill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--color-lime-400)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Marcador só no ponto mais recente — o que importa na leitura */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="5"
            fill="var(--color-lime-400)"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="10"
            fill="var(--color-lime-400)"
            opacity="0.2"
          />

          {/* Eixo do tempo */}
          {points.map((p, index) =>
            index % labelStep === 0 || index === points.length - 1 ? (
              <text
                key={p.point.period}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-forest-500 font-mono text-[11px] uppercase"
              >
                {new Date(p.point.period)
                  .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
                  .replace(".", "")}
              </text>
            ) : null
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/8 px-4 py-3 text-[11px] sm:px-6">
        <span className="text-forest-300">
          Mínimo{" "}
          <strong className="font-mono text-white tabular-nums">
            {formatIndicator(rawMin, unit)}
          </strong>
        </span>
        <span className="text-forest-300">
          Máximo{" "}
          <strong className="font-mono text-white tabular-nums">
            {formatIndicator(rawMax, unit)}
          </strong>
        </span>
        <span className="text-forest-300">
          Atual{" "}
          <strong className="font-mono text-lime-400 tabular-nums">
            {formatIndicator(values[values.length - 1], unit)}
          </strong>
        </span>
      </div>
    </section>
  );
}

/**
 * Bloco de conversão.
 *
 * Aparece onde o dado foi cortado, listando item a item o que o assinante
 * recebe — a "amostra honesta": o leitor viu dado real acima e sabe
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
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-forest-800 to-forest-900 text-white ring-1 ring-lime-400/25 ${
        compact ? "p-5" : "p-5 sm:p-7"
      }`}
    >
      {/* Brilho decorativo no canto — dá foco sem pedir atenção */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-400">
            <LockIcon className="h-3 w-3" />
            Exclusivo para assinantes
          </p>
          <h3 className="mt-2.5 text-balance text-lg font-bold leading-snug sm:text-xl">
            {headline}
          </h3>
          {detail && (
            <p className="mt-2 text-sm leading-relaxed text-forest-200">{detail}</p>
          )}

          {!compact && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {PRO_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex gap-2 text-[13px] text-forest-200">
                  <CheckGlyph />
                  {benefit}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/premium"
          className="shrink-0 self-start rounded-full bg-lime-400 px-6 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-forest-800 transition-all hover:bg-lime-500 hover:shadow-[0_8px_24px_rgba(178,224,47,0.35)] lg:self-center"
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
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${SURFACE} overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-forest-300">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- glifos

function TrendGlyph({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "flat") return <span aria-hidden="true">–</span>;
  return (
    <svg viewBox="0 0 10 10" className="h-2 w-2" fill="currentColor" aria-hidden="true">
      <path d={trend === "up" ? "M5 1l4 7H1z" : "M5 9L1 2h8z"} />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
    >
      <path d="m3 8.5 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
