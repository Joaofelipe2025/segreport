/**
 * Tipos de domínio do SegReport.
 *
 * Espelham as tabelas planejadas no Supabase. Enquanto o preview roda com
 * dados fictícios, estes tipos são a única fonte de verdade do formato —
 * quando o banco entrar, as funções de `lib/data` trocam de corpo e nenhum
 * componente precisa mudar.
 */

// ---------------------------------------------------------------- acesso

/** Níveis de assinatura. A ordem importa: usada na comparação de acesso. */
export const TIERS = ["free", "pro", "corporate"] as const;
export type Tier = (typeof TIERS)[number];

// ---------------------------------------------------------------- editorial

export type CategorySlug =
  | "mercado"
  | "tecnologia"
  | "politica"
  | "regulacao"
  | "saude"
  | "auto"
  | "vida"
  | "agronegocio"
  | "cyber"
  | "beneficios"
  | "resseguros";

export interface Category {
  slug: CategorySlug;
  label: string;
  /** Aparece no menu principal (os demais ficam no dropdown). */
  primary: boolean;
  description: string;
}

export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  /** Colunista convidado escreve sob assinatura própria. */
  columnist: boolean;
}

export interface Article {
  slug: string;
  title: string;
  /** Linha de apoio sob a manchete. */
  standfirst: string;
  category: CategorySlug;
  authorSlug: string;
  publishedAt: string;
  /** Minutos de leitura, calculado na publicação. */
  readingMinutes: number;
  image: string;
  imageAlt: string;
  /** Parágrafos do corpo. Vira rich text quando o CMS entrar. */
  body: string[];
  tags: string[];
  featured?: "lead" | "secondary" | "strip";
  /** Matéria de análise restrita a assinantes. */
  minTier?: Tier;
}

// ---------------------------------------------------------------- hub

/** Ramos de seguro cobertos pelos indicadores. */
export type Branch =
  | "vida"
  | "saude"
  | "auto"
  | "residencial"
  | "empresarial"
  | "beneficios";

export interface IndicatorDefinition {
  key: string;
  label: string;
  branch: Branch;
  /** Como o número é apresentado. */
  unit: "percent" | "percent-points" | "brl-billions";
  /** Janela de comparação exibida ao lado do valor. */
  window: "YoY" | "YTD" | "MoM";
  /** Nível mínimo para ver o valor. Free vê apenas os `free`. */
  minTier: Tier;
  /** De onde o número veio — exibido junto ao dado. */
  source: string;
}

export interface IndicatorValue {
  key: string;
  /** ISO do primeiro dia do período (ex.: "2026-08-01"). */
  period: string;
  value: number;
  /** Variação contra o período anterior, em pontos percentuais. */
  deltaPp: number;
}

export interface Company {
  susepCode: string;
  name: string;
}

export interface Ranking {
  id: string;
  title: string;
  year: number;
  scope: "geral" | "saude" | "auto" | "vida";
  metricLabel: string;
  entries: RankingEntry[];
}

export interface RankingEntry {
  position: number;
  company: string;
  /** Em bilhões de reais. */
  value: number;
  /** Posições ganhas (+) ou perdidas (-) contra o ano anterior. */
  positionDelta: number;
}

export type Impact = "critical" | "high" | "medium" | "low";

export interface RadarSignal {
  id: string;
  title: string;
  summary: string;
  category: string;
  impact: Impact;
  date: string;
  links: { label: string; href: string }[];
  minTier: Tier;
}

export interface Report {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  pages: number;
  minTier: Tier;
}

// ---------------------------------------------------------------- portal

export interface FlashPost {
  slug: string;
  title: string;
  venue: string;
  date: string;
  photoCount: number;
  cover: string;
}

export type EventKind = "conference" | "webinar" | "award" | "meetup";

export interface MarketEvent {
  id: string;
  title: string;
  summary: string;
  kind: EventKind;
  date: string;
  time: string;
  location: string;
}
