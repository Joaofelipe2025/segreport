export type CategoryKey =
  | "auto"
  | "vida"
  | "saude"
  | "agro"
  | "resseguros"
  | "regulacao"
  | "tech";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  color: string;
  emoji: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "auto", label: "Auto", color: "#0D6E4F", emoji: "🚗" },
  { key: "vida", label: "Vida", color: "#12956A", emoji: "❤️" },
  { key: "saude", label: "Saúde", color: "#2B6CB0", emoji: "🩺" },
  { key: "agro", label: "Agro", color: "#7A8C1F", emoji: "🌱" },
  { key: "resseguros", label: "Resseguros", color: "#6B5B95", emoji: "🛡️" },
  { key: "regulacao", label: "Regulação", color: "#B87214", emoji: "⚡" },
  { key: "tech", label: "Tech", color: "#1A6FB0", emoji: "💻" },
];

export function getCategoryMeta(key: CategoryKey): CategoryMeta {
  const meta = CATEGORIES.find((category) => category.key === key);
  if (!meta) {
    throw new Error(`Categoria desconhecida: ${key}`);
  }
  return meta;
}
