import type { Metadata } from "next";
import { getCurrentTier, getIndicators, getIndicatorSeries } from "@/lib/data";
import { CURRENT_PERIOD } from "@/lib/data/indicators";
import {
  KpiCard,
  LockedKpiCard,
  SeriesChart,
  UpsellBlock,
} from "@/components/hub/DataBlocks";
import FilterTabs from "@/components/hub/FilterTabs";
import { BRANCH_LABELS, BRANCHES } from "@/lib/categories";
import type { Branch } from "@/lib/types";

export const metadata: Metadata = { title: "Indicadores" };

const PERIOD_OPTIONS = [
  { value: "", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];

/** Quantos meses a série mostra em cada janela. */
const MONTHS_BY_PERIOD: Record<string, number> = {
  "": 12,
  trimestral: 18,
  anual: 24,
};

export default async function IndicadoresPage(
  props: PageProps<"/hub/indicadores">
) {
  const params = await props.searchParams;
  const branch = typeof params.ramo === "string" ? params.ramo : "";
  const period = typeof params.periodo === "string" ? params.periodo : "";

  const tier = await getCurrentTier();
  const all = await getIndicators(tier);

  const visible = branch
    ? all.filter(({ definition }) => definition.branch === branch)
    : all;

  // O gráfico acompanha o primeiro indicador liberado do recorte.
  const chartTarget = visible.find((i) => !i.locked) ?? visible[0];
  const series = chartTarget
    ? await getIndicatorSeries(
        chartTarget.definition.key,
        tier,
        MONTHS_BY_PERIOD[period] ?? 12
      )
    : [];

  const branchOptions = [
    { value: "", label: "Todos" },
    ...BRANCHES.map((b: Branch) => ({ value: b, label: BRANCH_LABELS[b] })),
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
          Indicadores por ramo
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">
          Cada número traz fonte e período de apuração. Onde não há medição
          fechada, exibimos travessão — nunca zero.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <FilterTabs
          options={PERIOD_OPTIONS}
          active={period}
          paramName="periodo"
          basePath="/hub/indicadores"
          extraParams={{ ramo: branch || undefined }}
          variant="lime"
        />
        <FilterTabs
          options={branchOptions}
          active={branch}
          paramName="ramo"
          basePath="/hub/indicadores"
          extraParams={{ periodo: period || undefined }}
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline bg-white/60 px-6 py-14 text-center text-sm text-ink-3">
          Nenhum indicador para este recorte.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map(({ definition, value, deltaPp, series: spark, locked }) =>
            locked ? (
              <LockedKpiCard key={definition.key} definition={definition} />
            ) : (
              <KpiCard
                key={definition.key}
                definition={definition}
                value={value}
                deltaPp={deltaPp}
                series={spark}
                period={CURRENT_PERIOD}
              />
            )
          )}
        </div>
      )}

      {chartTarget && (
        <SeriesChart
          series={series}
          label={chartTarget.definition.label}
          unit={chartTarget.definition.unit}
          source={chartTarget.definition.source}
        />
      )}

      {tier === "free" && (
        <UpsellBlock
          headline="Série histórica de 5 anos e exportação em CSV"
          detail="No plano gratuito a evolução temporal mostra os últimos 12 meses dos indicadores abertos. O PRO libera 60 meses, todos os indicadores e o download dos dados."
        />
      )}
    </div>
  );
}
