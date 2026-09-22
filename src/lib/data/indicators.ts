import type { IndicatorDefinition, IndicatorValue } from "@/lib/types";

/**
 * Definições de indicador do Hub.
 *
 * `minTier` é o espelho de apresentação da policy de RLS. No banco, o Free
 * simplesmente não recebe as linhas de indicador `pro` — aqui a marcação
 * serve para desenhar o bloco de bloqueio no lugar do valor.
 */
export const INDICATOR_DEFINITIONS: IndicatorDefinition[] = [
  {
    key: "premios-vida",
    label: "Prêmios Vida",
    branch: "vida",
    unit: "percent",
    window: "YoY",
    minTier: "free",
    source: "SUSEP · Estatísticas de mercado",
  },
  {
    key: "premios-saude",
    label: "Prêmios Saúde",
    branch: "saude",
    unit: "percent",
    window: "YoY",
    minTier: "free",
    source: "ANS · Dados consolidados",
  },
  {
    key: "premios-auto",
    label: "Prêmios Auto",
    branch: "auto",
    unit: "percent",
    window: "YoY",
    minTier: "free",
    source: "SUSEP · Estatísticas de mercado",
  },
  {
    key: "premios-residencial",
    label: "Prêmios Residencial",
    branch: "residencial",
    unit: "percent",
    window: "YoY",
    minTier: "free",
    source: "SUSEP · Estatísticas de mercado",
  },
  {
    key: "premios-empresarial",
    label: "Prêmios Empresarial",
    branch: "empresarial",
    unit: "percent",
    window: "YoY",
    minTier: "free",
    source: "SUSEP · Estatísticas de mercado",
  },
  {
    key: "beneficios",
    label: "Benefícios",
    branch: "beneficios",
    unit: "percent",
    window: "YTD",
    minTier: "free",
    source: "ANS · Planos coletivos empresariais",
  },
  {
    key: "sinistralidade-saude",
    label: "Sinistralidade Saúde",
    branch: "saude",
    unit: "percent",
    window: "YoY",
    minTier: "pro",
    source: "ANS · Demonstrações contábeis",
  },
  {
    key: "sinistralidade-auto",
    label: "Sinistralidade Auto",
    branch: "auto",
    unit: "percent",
    window: "YoY",
    minTier: "pro",
    source: "SUSEP · Quadro estatístico",
  },
  {
    key: "reajuste-coletivos",
    label: "Reajuste Coletivos",
    branch: "saude",
    unit: "percent",
    window: "YTD",
    minTier: "pro",
    source: "ANS · Comunicados de reajuste",
  },
  {
    key: "market-share-top5",
    label: "Concentração Top 5",
    branch: "empresarial",
    unit: "percent",
    window: "YoY",
    minTier: "corporate",
    source: "SEGREPORT · Cálculo próprio sobre base SUSEP",
  },
];

/** Valor mais recente de cada indicador — o que aparece no ticker e nos cards. */
const LATEST: Record<string, { value: number; deltaPp: number }> = {
  "premios-vida": { value: 3.1, deltaPp: 0.3 },
  "premios-saude": { value: 6.2, deltaPp: 1.1 },
  "premios-auto": { value: 2.4, deltaPp: 0.3 },
  "premios-residencial": { value: 1.5, deltaPp: -0.3 },
  "premios-empresarial": { value: 2.0, deltaPp: 0.3 },
  beneficios: { value: 4.4, deltaPp: 0.5 },
  "sinistralidade-saude": { value: 82.5, deltaPp: -1.7 },
  "sinistralidade-auto": { value: 58.3, deltaPp: -2.8 },
  "reajuste-coletivos": { value: 11.8, deltaPp: -0.9 },
  "market-share-top5": { value: 61.4, deltaPp: 0.8 },
};

/** Período mais recente com dado fechado. */
export const CURRENT_PERIOD = "2026-08-01";

/**
 * Gera 24 meses de série a partir do valor atual, caminhando para trás com
 * uma variação determinística. Determinístico de propósito: o gráfico precisa
 * ser idêntico entre renderizações de servidor e cliente, senão o React
 * acusa divergência de hidratação.
 */
function buildSeries(key: string, latest: number): IndicatorValue[] {
  const values: IndicatorValue[] = [];
  const end = new Date(CURRENT_PERIOD);
  let current = latest;

  // Semente derivada da chave — mesma chave, mesma série, sempre.
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) % 9973;

  for (let i = 0; i < 24; i++) {
    const period = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const prev = current;

    values.unshift({
      key,
      period: period.toISOString().slice(0, 10),
      value: Number(current.toFixed(1)),
      deltaPp: Number((current - prev).toFixed(1)),
    });

    // Caminhada pseudoaleatória estável rumo ao passado.
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const step = ((seed / 2147483648) - 0.5) * (latest > 40 ? 2.4 : 0.9);
    current = Math.max(0.1, current - step);
  }

  // Recalcula a variação com o valor do mês anterior já conhecido.
  for (let i = 1; i < values.length; i++) {
    values[i].deltaPp = Number((values[i].value - values[i - 1].value).toFixed(1));
  }

  return values;
}

export const INDICATOR_SERIES: Record<string, IndicatorValue[]> =
  Object.fromEntries(
    INDICATOR_DEFINITIONS.map((def) => [
      def.key,
      buildSeries(def.key, LATEST[def.key].value),
    ])
  );

export function latestValue(key: string): IndicatorValue | undefined {
  const def = LATEST[key];
  if (!def) return undefined;
  return { key, period: CURRENT_PERIOD, value: def.value, deltaPp: def.deltaPp };
}

const BY_KEY = new Map(INDICATOR_DEFINITIONS.map((d) => [d.key, d]));

export function findIndicator(key: string): IndicatorDefinition | undefined {
  return BY_KEY.get(key);
}
