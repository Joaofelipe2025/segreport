import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentTier, getRankings } from "@/lib/data";
import { DataPanel } from "@/components/hub/DataBlocks";
import FilterTabs from "@/components/hub/FilterTabs";
import { LockIcon } from "@/components/ui/Badge";
import type { Ranking } from "@/lib/types";
import { PRO_BENEFITS, RANKING_FREE_LIMIT } from "@/lib/tier";

export const metadata: Metadata = { title: "Rankings" };

const SCOPE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "geral", label: "Geral" },
  { value: "saude", label: "Saúde" },
  { value: "auto", label: "Auto" },
  { value: "vida", label: "Vida" },
];

export default async function RankingsPage(props: PageProps<"/hub/rankings">) {
  const params = await props.searchParams;
  const scope = typeof params.escopo === "string" ? params.escopo : "";

  const tier = await getCurrentTier();
  const all = await getRankings(tier);
  const visible = scope
    ? all.filter(({ ranking }) => ranking.scope === scope)
    : all;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">
          Rankings de seguradoras
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">
          Posições calculadas sobre prêmios emitidos no exercício. A variação
          indica posições ganhas ou perdidas contra o ano anterior.
        </p>
      </header>

      <FilterTabs
        options={SCOPE_OPTIONS}
        active={scope}
        paramName="escopo"
        basePath="/hub/rankings"
      />

      <div className="space-y-6">
        {visible.map(({ ranking, totalEntries, hiddenCount }) => (
          <RankingTable
            key={ranking.id}
            ranking={ranking}
            totalEntries={totalEntries}
            hiddenCount={hiddenCount}
            isFree={tier === "free"}
          />
        ))}
      </div>
    </div>
  );
}

function RankingTable({
  ranking,
  totalEntries,
  hiddenCount,
  isFree,
}: {
  ranking: Ranking;
  totalEntries: number;
  hiddenCount: number;
  isFree: boolean;
}) {
  return (
    <DataPanel
      title={ranking.title}
      action={
        <div className="flex items-center gap-2">
          <span className="rounded bg-forest-700 px-2.5 py-1 font-mono text-[11px] text-forest-200">
            {ranking.year}
          </span>
          <ExportButton disabled={isFree} label="Copiar" />
          <ExportButton disabled={isFree} label="CSV" primary />
        </div>
      }
    >
      <table className="w-full text-sm">
        <caption className="sr-only">
          {ranking.title} — {ranking.metricLabel}
        </caption>
        <thead>
          <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-forest-300">
            <th scope="col" className="px-5 py-3 text-left font-semibold sm:px-6">
              #
            </th>
            <th scope="col" className="px-2 py-3 text-left font-semibold">
              Empresa
            </th>
            <th scope="col" className="px-2 py-3 text-right font-semibold">
              Valor
            </th>
            <th scope="col" className="px-5 py-3 text-right font-semibold sm:px-6">
              Variação
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {ranking.entries.map((entry) => (
            <tr key={entry.position} className="transition-colors hover:bg-forest-700">
              <td className="px-5 py-3.5 font-mono font-bold text-lime-400 sm:px-6">
                {entry.position}
              </td>
              <td className="px-2 py-3.5 font-medium text-white">{entry.company}</td>
              <td className="px-2 py-3.5 text-right font-mono text-forest-100">
                R$ {entry.value.toFixed(1).replace(".", ",")} bi
              </td>
              <td className="px-5 py-3.5 text-right sm:px-6">
                <PositionDelta delta={entry.positionDelta} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hiddenCount > 0 && (
        <RankingPaywall hiddenCount={hiddenCount} totalEntries={totalEntries} />
      )}
    </DataPanel>
  );
}

/**
 * Corte do ranking para o leitor gratuito.
 *
 * As posições ocultas nunca foram consultadas — a camada de dados aplicou o
 * limite, espelhando a policy de RLS. O bloco abaixo só sabe *quantas*
 * ficaram de fora, nunca quais.
 */
function RankingPaywall({
  hiddenCount,
  totalEntries,
}: {
  hiddenCount: number;
  totalEntries: number;
}) {
  return (
    <div className="border-t border-dashed border-lime-400/30 bg-forest-900/50 px-5 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-lime-400">
            <LockIcon className="h-3 w-3" />+{hiddenCount} posições no plano PRO
          </p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-forest-200">
            O plano gratuito mostra as {RANKING_FREE_LIMIT} primeiras de{" "}
            {totalEntries}. Assinantes veem a tabela completa com:
          </p>
          <p className="mt-2 text-[13px] text-forest-300">
            {PRO_BENEFITS.slice(1, 5).join(" · ")}
          </p>
        </div>

        <Link
          href="/premium"
          className="shrink-0 rounded-full bg-lime-400 px-6 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500"
        >
          Ver ranking completo
        </Link>
      </div>
    </div>
  );
}

function PositionDelta({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-forest-500">—</span>;
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${up ? "text-up" : "text-down"}`}>
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d={up ? "M2 9 10 3M10 3H6M10 3v4" : "M2 3l8 6M10 9H6M10 9V5"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {Math.abs(delta)}
    </span>
  );
}

/**
 * Exportação é benefício PRO — no gratuito o botão aparece desabilitado com
 * o motivo, em vez de sumir. Mostrar o recurso bloqueado comunica o valor da
 * assinatura melhor do que escondê-lo.
 */
function ExportButton({
  label,
  disabled,
  primary = false,
}: {
  label: string;
  disabled: boolean;
  primary?: boolean;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold transition-colors";

  if (disabled) {
    return (
      <span
        className={`${base} cursor-not-allowed bg-forest-700 text-forest-500`}
        title="Exportação disponível no plano PRO"
      >
        <LockIcon className="h-2.5 w-2.5" />
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`${base} ${primary ? "bg-lime-400 text-forest-800 hover:bg-lime-500" : "bg-forest-700 text-forest-100 hover:bg-forest-600"}`}
    >
      {label}
    </button>
  );
}
