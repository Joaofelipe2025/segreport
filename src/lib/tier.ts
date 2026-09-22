import { TIERS, type Tier } from "@/lib/types";

/**
 * Controle de acesso por nível de assinatura.
 *
 * ATENÇÃO — este módulo é conveniência de APRESENTAÇÃO, não segurança.
 * A garantia real mora nas policies de RLS do Postgres: o dado que um Free
 * não pode ver nunca é selecionado. Estas funções existem só para decidir
 * o que desenhar (bloco de upsell vs. valor), assumindo que a query já
 * devolveu apenas o permitido.
 *
 * Nunca use `canAccess` como única barreira entre o usuário e um dado.
 */

const RANK: Record<Tier, number> = { free: 0, pro: 1, corporate: 2 };

export function canAccess(userTier: Tier, minTier: Tier = "free"): boolean {
  return RANK[userTier] >= RANK[minTier];
}

export function isValidTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value);
}

export const TIER_LABELS: Record<Tier, string> = {
  free: "Gratuito",
  pro: "PRO",
  corporate: "Corporate",
};

/**
 * Quantidade de posições de ranking visíveis por nível.
 *
 * Espelha a policy de RLS `position <= 3 or current_tier() in ('pro','corporate')`.
 * Mantenha os dois em sincronia: se a policy mudar, mude aqui também.
 */
export const RANKING_FREE_LIMIT = 3;

export function rankingLimit(tier: Tier): number {
  return canAccess(tier, "pro") ? Number.POSITIVE_INFINITY : RANKING_FREE_LIMIT;
}

/**
 * O que o assinante PRO ganha além do que está visível.
 * Exibido literalmente no bloco de bloqueio — vender item a item converte
 * melhor que desfocar o número.
 */
export const PRO_BENEFITS = [
  "Top 20 completo de todos os rankings",
  "Sinistralidade e market share por ramo",
  "Série histórica de 5 anos",
  "Exportação em CSV e relatórios em PDF",
  "Alertas por variação de indicador",
  "Navegação sem anúncios",
];
