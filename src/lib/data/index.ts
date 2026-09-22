import type {
  Article,
  Author,
  CategorySlug,
  IndicatorDefinition,
  IndicatorValue,
  MarketEvent,
  Ranking,
  RadarSignal,
  Report,
  Tier,
} from "@/lib/types";
import { canAccess, rankingLimit } from "@/lib/tier";
import { ARTICLES, findArticle } from "./articles";
import { AUTHORS, findAuthor } from "./authors";
import {
  INDICATOR_DEFINITIONS,
  INDICATOR_SERIES,
  latestValue,
} from "./indicators";
import { RANKINGS, RADAR_SIGNALS, REPORTS } from "./hub";
import { FLASH_POSTS, EVENTS } from "./portal";

/**
 * Camada de acesso a dados.
 *
 * Todas as funções são assíncronas de propósito, mesmo lendo de memória:
 * quando o Supabase entrar, só o corpo muda e nenhum componente precisa ser
 * reescrito.
 *
 * O CORTE POR NÍVEL ACONTECE AQUI, nunca no componente. É a regra que o
 * paywall depende: o que o Free não pode ver não sai desta camada, então
 * não existe no HTML entregue ao navegador.
 */

const byDateDesc = (a: { publishedAt: string }, b: { publishedAt: string }) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

// ------------------------------------------------------------------ editorial

export async function getArticles(options?: {
  category?: CategorySlug;
  authorSlug?: string;
  limit?: number;
  exclude?: string[];
}): Promise<Article[]> {
  let rows = [...ARTICLES].sort(byDateDesc);

  if (options?.category) rows = rows.filter((a) => a.category === options.category);
  if (options?.authorSlug)
    rows = rows.filter((a) => a.authorSlug === options.authorSlug);
  if (options?.exclude?.length)
    rows = rows.filter((a) => !options.exclude!.includes(a.slug));
  if (options?.limit) rows = rows.slice(0, options.limit);

  return rows;
}

export async function getArticle(slug: string): Promise<Article | null> {
  return findArticle(slug) ?? null;
}

/** Destaques da home, por posição de vitrine. */
export async function getFeatured(): Promise<{
  lead: Article;
  secondary: Article[];
  strip: Article[];
}> {
  const sorted = [...ARTICLES].sort(byDateDesc);
  const lead = sorted.find((a) => a.featured === "lead") ?? sorted[0];
  return {
    lead,
    secondary: sorted.filter((a) => a.featured === "secondary").slice(0, 2),
    strip: sorted.filter((a) => a.featured === "strip").slice(0, 5),
  };
}

/**
 * Mais lidas. Com o banco, vira agregação de `article_views`; aqui usa uma
 * ordem fixa para o preview não mudar a cada recarga.
 */
export async function getMostRead(limit = 5): Promise<Article[]> {
  const order = [
    "mercado-segurador-crescimento-dois-digitos",
    "fusoes-aquisicoes-corretagem",
    "lucro-liquido-setor-sobe-15",
    "seguradoras-investem-ia-analise-sinistros",
    "open-insurance-nova-fase",
    "cyber-seguro-cresce-40-por-cento",
  ];
  return order
    .map((slug) => findArticle(slug))
    .filter((a): a is Article => Boolean(a))
    .slice(0, limit);
}

export async function getAuthors(onlyColumnists = false): Promise<Author[]> {
  return onlyColumnists ? AUTHORS.filter((a) => a.columnist) : AUTHORS;
}

export async function getAuthor(slug: string): Promise<Author | null> {
  return findAuthor(slug) ?? null;
}

// ------------------------------------------------------------------ hub

/**
 * Indicadores visíveis para o nível informado.
 *
 * Um indicador acima do nível do usuário volta com `value: null` — a
 * definição (rótulo, ramo, fonte) é pública, o número não é. Isso permite
 * mostrar o card de bloqueio nomeando o que ele está perdendo, sem nunca
 * enviar o valor.
 */
export async function getIndicators(tier: Tier): Promise<
  Array<{
    definition: IndicatorDefinition;
    value: number | null;
    deltaPp: number | null;
    /** Últimos 12 pontos, para a sparkline do cartão. Vazio se bloqueado. */
    series: number[];
    locked: boolean;
  }>
> {
  return INDICATOR_DEFINITIONS.map((definition) => {
    const allowed = canAccess(tier, definition.minTier);
    const latest = latestValue(definition.key);
    return {
      definition,
      value: allowed ? (latest?.value ?? null) : null,
      deltaPp: allowed ? (latest?.deltaPp ?? null) : null,
      series: allowed
        ? (INDICATOR_SERIES[definition.key] ?? []).slice(-12).map((p) => p.value)
        : [],
      locked: !allowed,
    };
  });
}

/** Série temporal de um indicador. Vazia se o nível não permite. */
export async function getIndicatorSeries(
  key: string,
  tier: Tier,
  months = 12
): Promise<IndicatorValue[]> {
  const definition = INDICATOR_DEFINITIONS.find((d) => d.key === key);
  if (!definition || !canAccess(tier, definition.minTier)) return [];
  return (INDICATOR_SERIES[key] ?? []).slice(-months);
}

/**
 * Ranking com o corte de posições aplicado na consulta.
 *
 * Espelha `position <= 3 or current_tier() in ('pro','corporate')`. O total
 * de posições volta junto para que a interface possa dizer quantas ficaram
 * de fora sem precisar tê-las em mãos.
 */
export async function getRanking(
  id: string,
  tier: Tier
): Promise<{ ranking: Ranking; totalEntries: number; hiddenCount: number } | null> {
  const found = RANKINGS.find((r) => r.id === id);
  if (!found) return null;

  const limit = rankingLimit(tier);
  const visible = found.entries.filter((e) => e.position <= limit);

  return {
    ranking: { ...found, entries: visible },
    totalEntries: found.entries.length,
    hiddenCount: found.entries.length - visible.length,
  };
}

export async function getRankings(
  tier: Tier
): Promise<Array<{ ranking: Ranking; totalEntries: number; hiddenCount: number }>> {
  const results = await Promise.all(RANKINGS.map((r) => getRanking(r.id, tier)));
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

export async function getRadarSignals(
  tier: Tier,
  limit?: number
): Promise<{ signals: RadarSignal[]; hiddenCount: number }> {
  const allowed = RADAR_SIGNALS.filter((s) => canAccess(tier, s.minTier));
  const sorted = allowed.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return {
    signals: limit ? sorted.slice(0, limit) : sorted,
    hiddenCount: RADAR_SIGNALS.length - allowed.length,
  };
}

/** Relatórios: o catálogo é público, o arquivo é que é restrito. */
export async function getReports(
  tier: Tier
): Promise<Array<{ report: Report; locked: boolean }>> {
  return REPORTS.map((report) => ({
    report,
    locked: !canAccess(tier, report.minTier),
  }));
}

// ------------------------------------------------------------------ portal

export async function getFlashPosts(limit?: number) {
  const sorted = [...FLASH_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getEvents(): Promise<MarketEvent[]> {
  return [...EVENTS].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// ------------------------------------------------------------------ sessão

/**
 * Nível do visitante.
 *
 * Fixo em `free` enquanto o login não existe — é o que faz o preview mostrar
 * os bloqueios de PRO exatamente como um visitante não assinante veria.
 * Quando o Supabase Auth entrar, lê a assinatura da sessão.
 */
export async function getCurrentTier(): Promise<Tier> {
  return "free";
}
