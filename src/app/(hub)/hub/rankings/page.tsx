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
    <div className="space-y-7">
      <header>
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
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
  // A barra de magnitude usa o líder como referência: mostra de relance que a
  // distância entre 1º e 4º é maior que entre 4º e 10º, leitura que a coluna
  // de números sozinha não entrega.
  const leader = Math.max(...ranking.entries.map((e) => e.value), 1);

  return (
    <DataPanel
      title={ranking.title}
      subtitle={`${ranking.metricLabel} · ${ranking.year}`}
      action={
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton disabled={isFree} label="Copiar" />
          <ExportButton disabled={isFree} label="CSV" primary />
        </div>
      }
    >
      <table className="w-full">
        <caption className="sr-only">
          {ranking.title} — {ranking.metricLabel}, {ranking.year}
        </caption>

        <thead>
          <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.08em] text-forest-500">
            <th scope="col" className="w-10 py-2.5 pl-4 text-left font-semibold sm:pl-6">
              #
            </th>
            <th scope="col" className="py-2.5 pl-2 text-left font-semibold">
              Empresa
            </th>
            <th scope="col" className="py-2.5 pr-4 text-right font-semibold sm:pr-6">
              <span className="sm:hidden">Valor</span>
              <span className="hidden sm:inline">Prêmios</span>
            </th>
            {/* Coluna própria só a partir de sm; abaixo disso a variação
                aparece embaixo do valor, para caber em 375px sem rolagem. */}
            <th scope="col" className="hidden w-24 py-2.5 pr-6 text-right font-semibold sm:table-cell">
              Variação
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/[0.06]">
          {ranking.entries.map((entry) => {
            const isPodium = entry.position <= 3;
            return (
              <tr
                key={entry.position}
                className="group transition-colors hover:bg-white/[0.04]"
              >
                <td className="py-3 pl-4 align-middle sm:pl-6">
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      isPodium ? "text-lime-400" : "text-forest-400"
                    }`}
                  >
                    {entry.position}
                  </span>
                </td>

                <td className="py-3 pl-2 align-middle">
                  <p className="text-[13px] font-semibold leading-tight text-white sm:text-sm">
                    {entry.company}
                  </p>
                  {/* Barra de magnitude relativa ao líder */}
                  <div className="mt-1.5 h-[3px] w-full max-w-[220px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPodium ? "bg-lime-400/80" : "bg-forest-500"
                      }`}
                      style={{ width: `${Math.max((entry.value / leader) * 100, 2)}%` }}
                    />
                  </div>
                </td>

                <td className="py-3 pr-4 text-right align-middle sm:pr-6">
                  <p className="font-mono text-[13px] font-semibold tabular-nums text-forest-100 sm:text-sm">
                    R$ {entry.value.toFixed(1).replace(".", ",")} bi
                  </p>
                  <div className="mt-1 sm:hidden">
                    <PositionDelta delta={entry.positionDelta} />
                  </div>
                </td>

                <td className="hidden py-3 pr-6 text-right align-middle sm:table-cell">
                  <PositionDelta delta={entry.positionDelta} />
                </td>
              </tr>
            );
          })}
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
 * limite, espelhando a policy de RLS. Este bloco só sabe *quantas* ficaram de
 * fora, nunca quais.
 */
function RankingPaywall({
  hiddenCount,
  totalEntries,
}: {
  hiddenCount: number;
  totalEntries: number;
}) {
  return (
    <div className="relative overflow-hidden border-t border-lime-400/20 bg-forest-900/60 px-4 py-5 sm:px-6">
      {/* Degradê no topo sugere continuidade da tabela, reforçando que há
          mais dado logo acima do corte. */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-forest-900/60 to-transparent"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-lime-400">
            <LockIcon className="h-3 w-3" />
            mais {hiddenCount} posições no plano PRO
          </p>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-forest-200">
            O plano gratuito mostra as {RANKING_FREE_LIMIT} primeiras de{" "}
            {totalEntries}. Assinantes veem a tabela completa, com{" "}
            {PRO_BENEFITS.slice(1, 4).join(", ").toLowerCase()}.
          </p>
        </div>

        <Link
          href="/premium"
          className="shrink-0 self-start rounded-full bg-lime-400 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-forest-800 transition-all hover:bg-lime-500 hover:shadow-[0_8px_24px_rgba(178,224,47,0.35)] lg:self-center"
        >
          Ver ranking completo
        </Link>
      </div>
    </div>
  );
}

function PositionDelta({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="font-mono text-xs text-forest-600" title="sem mudança">
        —
      </span>
    );
  }

  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
        up ? "bg-up/12 text-up" : "bg-down/12 text-down"
      }`}
      title={`${Math.abs(delta)} ${Math.abs(delta) === 1 ? "posição" : "posições"} ${up ? "acima" : "abaixo"} do ano anterior`}
    >
      <svg viewBox="0 0 10 10" className="h-2 w-2" fill="currentColor" aria-hidden="true">
        <path d={up ? "M5 1l4 7H1z" : "M5 9L1 2h8z"} />
      </svg>
      {Math.abs(delta)}
    </span>
  );
}

/**
 * Exportação é benefício PRO — no gratuito o botão aparece desabilitado com o
 * motivo, em vez de sumir. Mostrar o recurso bloqueado comunica o valor da
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
    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors";

  if (disabled) {
    return (
      <span
        className={`${base} cursor-not-allowed bg-white/5 text-forest-500`}
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
      className={`${base} ${
        primary
          ? "bg-lime-400 text-forest-800 hover:bg-lime-500"
          : "bg-white/8 text-forest-100 hover:bg-white/14"
      }`}
    >
      {label}
    </button>
  );
}
