import type { Category, CategorySlug, Branch } from "@/lib/types";

/**
 * Categorias editoriais. `primary: true` aparece na navegação principal;
 * o resto vive no dropdown "Regulação & Seguros".
 */
export const CATEGORIES: Category[] = [
  {
    slug: "mercado",
    label: "Mercado",
    primary: true,
    description:
      "Resultados, fusões, aquisições e movimentos das seguradoras brasileiras.",
  },
  {
    slug: "tecnologia",
    label: "Tecnologia",
    primary: true,
    description:
      "Insurtechs, inteligência artificial e automação aplicadas ao seguro.",
  },
  {
    slug: "politica",
    label: "Política",
    primary: true,
    description:
      "Decisões do Congresso, do Executivo e dos tribunais que afetam o setor.",
  },
  {
    slug: "regulacao",
    label: "Regulação",
    primary: false,
    description:
      "SUSEP, ANS e CNSP: circulares, resoluções e consultas públicas.",
  },
  {
    slug: "saude",
    label: "Saúde",
    primary: false,
    description:
      "Planos de saúde, operadoras, reajustes e rede credenciada.",
  },
  {
    slug: "auto",
    label: "Auto",
    primary: false,
    description:
      "Seguro de automóvel, sinistralidade, telemetria e frota.",
  },
  {
    slug: "vida",
    label: "Vida",
    primary: false,
    description: "Seguro de vida, previdência e produtos de acumulação.",
  },
  {
    slug: "agronegocio",
    label: "Agronegócio",
    primary: false,
    description:
      "Seguro rural, paramétricos e gestão de risco climático no campo.",
  },
  {
    slug: "cyber",
    label: "Cyber",
    primary: false,
    description:
      "Riscos cibernéticos, proteção de dados e seguro de responsabilidade digital.",
  },
  {
    slug: "beneficios",
    label: "Benefícios",
    primary: false,
    description:
      "Benefícios corporativos, saúde ocupacional e seguros coletivos.",
  },
  {
    slug: "resseguros",
    label: "Resseguros",
    primary: false,
    description:
      "Resseguradoras, capacidade, retrocessão e mercado internacional.",
  },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category | undefined {
  return BY_SLUG.get(slug as CategorySlug);
}

export function categoryLabel(slug: CategorySlug): string {
  return BY_SLUG.get(slug)?.label ?? slug;
}

export const PRIMARY_CATEGORIES = CATEGORIES.filter((c) => c.primary);
export const SECONDARY_CATEGORIES = CATEGORIES.filter((c) => !c.primary);

/** Rótulos dos ramos usados no Hub (distintos das categorias editoriais). */
export const BRANCH_LABELS: Record<Branch, string> = {
  vida: "Vida",
  saude: "Saúde",
  auto: "Auto",
  residencial: "Residencial",
  empresarial: "Empresarial",
  beneficios: "Benefícios",
};

export const BRANCHES = Object.keys(BRANCH_LABELS) as Branch[];
