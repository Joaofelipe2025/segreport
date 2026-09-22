import Link from "next/link";
import type { CategorySlug, Impact, Tier } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";

/**
 * Selo de categoria.
 *
 * Direção visual aprovada: o lima é reservado a dado e ação, então a
 * categoria usa verde-claro com filete lima — presente, mas sem disputar
 * atenção com o número no Hub nem com o botão de assinar.
 */
export function CategoryBadge({
  category,
  onDark = false,
  href = true,
}: {
  category: CategorySlug;
  onDark?: boolean;
  href?: boolean;
}) {
  const className = [
    "inline-block border-l-[3px] border-lime-400 px-2 py-1",
    "text-[10px] font-extrabold uppercase tracking-[0.08em]",
    onDark
      ? "bg-forest-800/85 text-forest-100 backdrop-blur-sm"
      : "bg-forest-100 text-forest-700",
  ].join(" ");

  const label = categoryLabel(category);

  if (!href) return <span className={className}>{label}</span>;

  return (
    <Link href={`/${category}`} className={`${className} hover:bg-forest-200 transition-colors`}>
      {label}
    </Link>
  );
}

const IMPACT_META: Record<Impact, { label: string; className: string }> = {
  critical: { label: "Impacto Crítico", className: "bg-[#fdeced] text-[#a5252a]" },
  high: { label: "Impacto Alto", className: "bg-[#fdf0e6] text-[#9c5416]" },
  medium: { label: "Impacto Médio", className: "bg-[#fbf6e0] text-[#7d6612]" },
  low: { label: "Impacto Baixo", className: "bg-[#eef3f5] text-[#4a6470]" },
};

export function ImpactBadge({ impact }: { impact: Impact }) {
  const meta = IMPACT_META[impact];
  return (
    <span
      className={`inline-block rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/** Marca o conteúdo restrito. Lima como superfície, texto verde-escuro. */
export function TierBadge({ tier }: { tier: Tier }) {
  if (tier === "free") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-lime-400 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-forest-800">
      <LockIcon className="h-2.5 w-2.5" />
      {tier === "pro" ? "PRO" : "Corporate"}
    </span>
  );
}

export function LockIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
