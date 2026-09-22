import type { Ranking, RadarSignal, Report, Company } from "@/lib/types";

/**
 * Seguradoras identificadas por código SUSEP.
 *
 * O código é a chave que vai amarrar ranking, indicador e a importação dos
 * dados abertos no sub-projeto 4. Sem ele, casar seguradora por nome vira
 * trabalho manual a cada importação.
 */
export const COMPANIES: Company[] = [
  { susepCode: "05711", name: "Bradesco Seguros" },
  { susepCode: "06025", name: "BB Seguros" },
  { susepCode: "05207", name: "Itaú Seguros" },
  { susepCode: "05266", name: "Porto Seguro" },
  { susepCode: "06114", name: "Caixa Seguradora" },
  { susepCode: "05185", name: "SulAmérica" },
  { susepCode: "05495", name: "Zurich Santander" },
  { susepCode: "06467", name: "Mapfre Seguros" },
  { susepCode: "05860", name: "Allianz Seguros" },
  { susepCode: "05207", name: "Tokio Marine" },
];

export const RANKINGS: Ranking[] = [
  {
    id: "premios-geral-2026",
    title: "Top 20 Seguradoras por Prêmios Emitidos",
    year: 2026,
    scope: "geral",
    metricLabel: "Prêmios emitidos",
    entries: [
      { position: 1, company: "Bradesco Seguros", value: 95.2, positionDelta: 0 },
      { position: 2, company: "BB Seguros", value: 72.8, positionDelta: 1 },
      { position: 3, company: "Itaú Seguros", value: 68.4, positionDelta: -1 },
      { position: 4, company: "Porto Seguro", value: 45.1, positionDelta: 0 },
      { position: 5, company: "Caixa Seguradora", value: 38.9, positionDelta: 2 },
      { position: 6, company: "SulAmérica", value: 34.2, positionDelta: -1 },
      { position: 7, company: "Zurich Santander", value: 29.7, positionDelta: 0 },
      { position: 8, company: "Mapfre Seguros", value: 26.3, positionDelta: 1 },
      { position: 9, company: "Allianz Seguros", value: 24.8, positionDelta: -2 },
      { position: 10, company: "Tokio Marine", value: 21.5, positionDelta: 0 },
      { position: 11, company: "Liberty Seguros", value: 18.9, positionDelta: 3 },
      { position: 12, company: "HDI Seguros", value: 17.2, positionDelta: -1 },
      { position: 13, company: "Chubb Seguros", value: 15.6, positionDelta: 0 },
      { position: 14, company: "Sompo Seguros", value: 14.1, positionDelta: 1 },
      { position: 15, company: "Icatu Seguros", value: 12.8, positionDelta: -1 },
      { position: 16, company: "Prudential do Brasil", value: 11.4, positionDelta: 2 },
      { position: 17, company: "Generali Brasil", value: 9.7, positionDelta: 0 },
      { position: 18, company: "Too Seguros", value: 8.3, positionDelta: -2 },
      { position: 19, company: "Alfa Seguradora", value: 7.1, positionDelta: 0 },
      { position: 20, company: "Excelsior Seguros", value: 6.4, positionDelta: 1 },
    ],
  },
  {
    id: "premios-saude-2026",
    title: "Top 20 Operadoras de Saúde por Receita",
    year: 2026,
    scope: "saude",
    metricLabel: "Receita de contraprestações",
    entries: [
      { position: 1, company: "Hapvida NotreDame", value: 31.4, positionDelta: 0 },
      { position: 2, company: "Bradesco Saúde", value: 28.9, positionDelta: 0 },
      { position: 3, company: "SulAmérica Saúde", value: 22.1, positionDelta: 1 },
      { position: 4, company: "Amil", value: 19.8, positionDelta: -1 },
      { position: 5, company: "Unimed Nacional", value: 17.3, positionDelta: 0 },
      { position: 6, company: "Porto Saúde", value: 9.2, positionDelta: 2 },
      { position: 7, company: "Care Plus", value: 6.8, positionDelta: 0 },
      { position: 8, company: "Omint", value: 5.4, positionDelta: -1 },
      { position: 9, company: "Prevent Senior", value: 4.9, positionDelta: -1 },
      { position: 10, company: "Alice", value: 2.1, positionDelta: 4 },
    ],
  },
  {
    id: "premios-auto-2026",
    title: "Top 20 Seguradoras de Automóvel",
    year: 2026,
    scope: "auto",
    metricLabel: "Prêmios emitidos · Auto",
    entries: [
      { position: 1, company: "Porto Seguro", value: 21.8, positionDelta: 0 },
      { position: 2, company: "Azul Seguros", value: 12.4, positionDelta: 1 },
      { position: 3, company: "Bradesco Auto", value: 11.9, positionDelta: -1 },
      { position: 4, company: "Allianz Seguros", value: 9.7, positionDelta: 0 },
      { position: 5, company: "HDI Seguros", value: 8.2, positionDelta: 2 },
      { position: 6, company: "Tokio Marine", value: 7.6, positionDelta: -1 },
      { position: 7, company: "Mapfre Seguros", value: 6.9, positionDelta: -1 },
      { position: 8, company: "Liberty Seguros", value: 5.3, positionDelta: 0 },
      { position: 9, company: "Sompo Seguros", value: 4.1, positionDelta: 1 },
      { position: 10, company: "Itaú Auto", value: 3.8, positionDelta: -1 },
    ],
  },
  {
    id: "premios-vida-2026",
    title: "Top 20 Seguradoras de Vida e Previdência",
    year: 2026,
    scope: "vida",
    metricLabel: "Prêmios emitidos · Vida",
    entries: [
      { position: 1, company: "Brasilprev", value: 42.6, positionDelta: 0 },
      { position: 2, company: "Bradesco Vida", value: 38.1, positionDelta: 0 },
      { position: 3, company: "Itaú Vida e Previdência", value: 31.7, positionDelta: 1 },
      { position: 4, company: "Caixa Vida", value: 24.3, positionDelta: -1 },
      { position: 5, company: "Zurich Santander", value: 18.9, positionDelta: 0 },
      { position: 6, company: "Icatu Seguros", value: 12.4, positionDelta: 2 },
      { position: 7, company: "Prudential do Brasil", value: 11.8, positionDelta: -1 },
      { position: 8, company: "MetLife", value: 8.6, positionDelta: -1 },
      { position: 9, company: "Mongeral Aegon", value: 6.2, positionDelta: 0 },
      { position: 10, company: "Porto Vida", value: 4.7, positionDelta: 1 },
    ],
  },
];

export const RADAR_SIGNALS: RadarSignal[] = [
  {
    id: "open-insurance-2",
    title: "Open Insurance 2.0 pode redefinir competição no mercado",
    summary:
      "Segunda fase do Open Insurance traz portabilidade completa de dados. Seguradoras com melhor experiência de cliente devem ganhar market share.",
    category: "Regulação",
    impact: "critical",
    date: "2026-09-20",
    links: [{ label: "gov.br", href: "https://www.gov.br" }],
    minTier: "free",
  },
  {
    id: "ia-generativa-sinistros",
    title: "IA generativa acelera automação de sinistros",
    summary:
      "Grandes players já usam modelos de linguagem para análise inicial de sinistros, reduzindo tempo de processamento em até 70%.",
    category: "Tecnologia",
    impact: "high",
    date: "2026-09-19",
    links: [],
    minTier: "free",
  },
  {
    id: "clima-precificacao-agricola",
    title: "Mudanças climáticas impactam precificação agrícola",
    summary:
      "Eventos extremos mais frequentes estão forçando reavaliação de modelos de risco no seguro rural.",
    category: "Agronegócio",
    impact: "high",
    date: "2026-09-18",
    links: [],
    minTier: "free",
  },
  {
    id: "seguros-embarcados-fintechs",
    title: "Crescimento de seguros embarcados em fintechs",
    summary:
      "Parcerias entre seguradoras e fintechs para oferta de microsseguros integrados crescem 150% ano a ano.",
    category: "Mercado",
    impact: "medium",
    date: "2026-09-17",
    links: [],
    minTier: "free",
  },
  {
    id: "capacidade-resseguro",
    title: "Aperto de capacidade no resseguro global",
    summary:
      "Renovação de janeiro deve chegar com taxa mais alta e exigência de retenção maior para cedentes brasileiras.",
    category: "Resseguros",
    impact: "high",
    date: "2026-09-16",
    links: [],
    minTier: "pro",
  },
  {
    id: "fraude-imagem-sintetica",
    title: "Fraude com imagem sintética em sinistros de auto",
    summary:
      "Laudos e fotos manipulados por ferramentas generativas começam a aparecer em volume relevante nas esteiras de regulação.",
    category: "Cyber",
    impact: "critical",
    date: "2026-09-15",
    links: [],
    minTier: "pro",
  },
  {
    id: "consulta-distribuicao-digital",
    title: "Consulta pública sobre distribuição digital",
    summary:
      "Minuta da SUSEP trata da responsabilidade do intermediário na venda embarcada em aplicativo de parceiro não segurador.",
    category: "Regulação",
    impact: "medium",
    date: "2026-09-14",
    links: [{ label: "susep.gov.br", href: "https://www.gov.br/susep" }],
    minTier: "free",
  },
  {
    id: "juros-resultado-financeiro",
    title: "Queda de juros pressiona resultado financeiro das reservas",
    summary:
      "Com menor retorno das reservas técnicas, o índice combinado volta a determinar o resultado das companhias.",
    category: "Mercado",
    impact: "low",
    date: "2026-09-12",
    links: [],
    minTier: "free",
  },
];

export const REPORTS: Report[] = [
  {
    id: "panorama-2026-s1",
    title: "Panorama do Mercado Segurador — 1º semestre de 2026",
    summary:
      "Arrecadação por ramo, sinistralidade consolidada e movimento das dez maiores companhias.",
    publishedAt: "2026-08-14",
    pages: 42,
    minTier: "pro",
  },
  {
    id: "saude-suplementar-2026",
    title: "Saúde Suplementar: reajuste, rede e sinistralidade",
    summary:
      "Análise da metodologia de reajuste de coletivos e do efeito da expansão de rede credenciada sobre o custo assistencial.",
    publishedAt: "2026-07-30",
    pages: 28,
    minTier: "pro",
  },
  {
    id: "cyber-brasil-2026",
    title: "Cyber no Brasil: subscrição, sinistros e capacidade",
    summary:
      "Como o mercado brasileiro de risco cibernético precifica, o que exige na contratação e onde está a capacidade.",
    publishedAt: "2026-07-02",
    pages: 35,
    minTier: "pro",
  },
  {
    id: "distribuicao-corretagem-2026",
    title: "Distribuição e corretagem: o mapa da consolidação",
    summary:
      "Levantamento das operações de M&A em corretagem nos últimos 24 meses e o efeito sobre comissionamento.",
    publishedAt: "2026-06-11",
    pages: 51,
    minTier: "corporate",
  },
  {
    id: "glossario-indicadores",
    title: "Glossário de indicadores do SegReport",
    summary:
      "Definição, fórmula e fonte de cada indicador publicado no Hub Inteligência.",
    publishedAt: "2026-05-20",
    pages: 12,
    minTier: "free",
  },
];
