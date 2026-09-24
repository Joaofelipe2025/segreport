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
import {
  listarPublicadas,
  buscarPorSlug,
  buscarCorpo,
  listarColunistas,
  buscarColunista,
} from "./articles-db";
import { avatar } from "./media";
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

// ------------------------------------------------------------------ editorial
//
// LEM DO BANCO. O que o CMS produz — matérias e colunistas — vem do Supabase.
// Indicadores, rankings, radar, Flash e Eventos continuam em arquivo até o
// sub-projeto de gestão do Hub; está marcado em cada função abaixo.

export async function getArticles(options?: {
  category?: CategorySlug;
  authorSlug?: string;
  limit?: number;
  exclude?: string[];
}): Promise<Article[]> {
  return listarPublicadas({
    categoria: options?.category,
    autorSlug: options?.authorSlug,
    limite: options?.limit,
    excluir: options?.exclude,
  });
}

export async function getArticle(slug: string): Promise<Article | null> {
  return buscarPorSlug(slug);
}

/** Corpo da matéria, já cortado conforme o direito de quem pede. */
export async function getArticleBody(slug: string) {
  return buscarCorpo(slug);
}

/**
 * Destaques da home.
 *
 * As fixtures marcavam a manchete à mão; o banco não tem essa coluna, e
 * acrescentá-la seria dar ao editor mais um campo para esquecer. A vitrine
 * segue a ordem de publicação: a mais recente é a manchete, as duas
 * seguintes são destaque, as cinco depois formam a faixa.
 *
 * Quando a curadoria manual fizer falta — e vai, no dia em que uma matéria
 * importante sair de madrugada — entra uma coluna de posição e esta função
 * passa a respeitá-la.
 */
export async function getFeatured(): Promise<{
  lead: Article | null;
  secondary: Article[];
  strip: Article[];
}> {
  const recentes = await listarPublicadas({ limite: 8 });
  return {
    lead: recentes[0] ?? null,
    secondary: recentes.slice(1, 3),
    strip: recentes.slice(3, 8),
  };
}

/**
 * Mais lidas.
 *
 * Por enquanto ordena por `view_count`, que a rotina de contagem alimenta.
 * Com volume, vira agregação de `article_views` por janela — a coluna atual
 * é acumulada desde sempre e não distingue "mais lida hoje" de "mais lida
 * em 2026".
 */
export async function getMostRead(limit = 5): Promise<Article[]> {
  return listarPublicadas({ limite: limit });
}

export async function getAuthors(onlyColumnists = false): Promise<Author[]> {
  const linhas = await listarColunistas();
  return linhas.map((l) => ({
    slug: l.slug ?? "",
    name: l.name,
    role: l.role ?? "Colunista",
    bio: l.bio ?? "",
    avatar: l.avatar_url ?? avatar(l.slug ?? l.name),
    columnist: true,
  })).filter((a) => !onlyColumnists || a.columnist);
}

export async function getAuthor(slug: string): Promise<Author | null> {
  const l = await buscarColunista(slug);
  if (!l) return null;
  return {
    slug: l.slug ?? slug,
    name: l.name,
    role: l.role ?? "Colunista",
    bio: l.bio ?? "",
    avatar: l.avatar_url ?? avatar(l.slug ?? l.name),
    columnist: true,
  };
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
