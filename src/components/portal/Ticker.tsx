import Link from "next/link";
import { getCurrentTier, getIndicators } from "@/lib/data";
import { formatIndicator, trendOf } from "@/lib/format";
import { LockIcon } from "@/components/ui/Badge";

/**
 * Faixa de indicadores no topo do portal.
 *
 * Diferença deliberada em relação ao protótipo: ali todos os valores eram
 * lima, mesmo os que caíram. Num ticker de mercado a cor precisa informar
 * direção — verde sobe, vermelho cai. O lima fica para o rótulo "Indicadores"
 * e para o dado bloqueado, que é onde ele significa "tem mais aqui dentro".
 */
export default async function Ticker() {
  const tier = await getCurrentTier();
  const indicators = await getIndicators(tier);

  const items = indicators.map(({ definition, value, deltaPp, locked }) => ({
    key: definition.key,
    label: definition.label.replace(/^Prêmios /, ""),
    window: definition.window,
    display: locked ? null : formatIndicator(value, definition.unit),
    trend: trendOf(deltaPp),
    locked,
  }));

  return (
    <div className="border-b border-white/8 bg-forest-900 text-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 lg:px-8">
        <Link
          href="/hub/indicadores"
          className="flex shrink-0 items-center gap-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-lime-400"
        >
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-lime-400" />
          Indicadores
        </Link>

        <div className="relative overflow-hidden">
          {/* Duplicado para o laço da animação não deixar vão */}
          <div className="animate-ticker flex w-max gap-7 py-2.5">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-7" aria-hidden={copy === 1}>
                {items.map(({ key, ...item }) => (
                  <TickerItem key={`${copy}-${key}`} {...item} />
                ))}
              </div>
            ))}
          </div>
          {/* Esmaece a borda direita para a faixa não "cortar" o texto */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-forest-900 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function TickerItem({
  label,
  window,
  display,
  trend,
  locked,
}: {
  label: string;
  window: string;
  display: string | null;
  trend: "up" | "down" | "flat";
  locked: boolean;
}) {
  return (
    <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-forest-300">
      <span>{label}</span>

      {locked ? (
        <span className="inline-flex items-center gap-1 text-lime-400">
          <LockIcon className="h-2.5 w-2.5" />
          <span className="font-sans text-[10px] font-semibold">PRO</span>
        </span>
      ) : (
        <>
          <span
            className={
              trend === "up"
                ? "font-bold text-up"
                : trend === "down"
                  ? "font-bold text-down"
                  : "font-bold text-forest-200"
            }
          >
            {display}
          </span>
          <TrendArrow trend={trend} />
        </>
      )}

      <span className="text-[10px] text-forest-500">{window}</span>
    </span>
  );
}

function TrendArrow({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "flat") return <span className="text-forest-500">—</span>;
  const up = trend === "up";
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-2.5 w-2.5 ${up ? "text-up" : "text-down"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-label={up ? "em alta" : "em queda"}
    >
      <path
        d={up ? "M2 9 10 3M10 3H6M10 3v4" : "M2 3l8 6M10 9H6M10 9V5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
