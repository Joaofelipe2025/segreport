"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegação entre as seções do Hub.
 *
 * Tratamento de aba com filete inferior em vez de retângulo preenchido: o
 * preenchido criava sete blocos disputando atenção com o conteúdo logo
 * abaixo. O filete marca posição sem competir, e é a convenção que o leitor
 * já conhece de painel de dados.
 *
 * Em tela estreita a faixa rola horizontalmente com pistas de recorte nas
 * bordas, preservando todas as seções sem quebrar em duas linhas.
 */

const TABS = [
  { href: "/hub", label: "Dashboard", icon: HomeIcon, exact: true },
  { href: "/hub/indicadores", label: "Indicadores", icon: TrendIcon },
  { href: "/hub/rankings", label: "Rankings", icon: BarsIcon },
  { href: "/hub/radar", label: "Radar", icon: RadarIcon },
  { href: "/hub/relatorios", label: "Relatórios", icon: DocIcon },
  { href: "/hub/alertas", label: "Alertas", icon: BellIcon },
  { href: "/hub/preferencias", label: "Preferências", icon: GearIcon },
];

export default function HubTabs() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 border-b border-hairline bg-white/92 backdrop-blur-md">
      <div className="relative mx-auto max-w-[1400px]">
        <nav
          aria-label="Seções do Hub Inteligência"
          className="no-scrollbar flex gap-0.5 overflow-x-auto px-4 lg:px-8"
        >
          {TABS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-3.5 text-[13px] font-semibold transition-colors sm:px-4 sm:text-sm ${
                  active
                    ? "text-forest-800"
                    : "text-ink-3 hover:text-forest-700"
                }`}
              >
                <span
                  className={`transition-colors ${active ? "text-forest-700" : "text-ink-4 group-hover:text-forest-600"}`}
                >
                  <Icon />
                </span>
                {label}

                <span
                  className={`absolute inset-x-1.5 bottom-0 h-[3px] rounded-t-full transition-all duration-300 ${
                    active
                      ? "bg-lime-400 opacity-100"
                      : "bg-forest-300 opacity-0 group-hover:opacity-40"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Pistas de recorte: avisam que a faixa continua fora da tela */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent lg:hidden"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-white to-transparent lg:hidden"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

const S = {
  className: "h-4 w-4",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  "aria-hidden": true,
} as const;

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="m4 10.5 8-6.5 8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M4 16 10 10l3.5 3.5L20 7M15 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M5 20V11M12 20V4M19 20v-6" strokeLinecap="round" />
    </svg>
  );
}
function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M6 3h8l4 4v14H6z" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 13.5 6 9" strokeLinejoin="round" />
      <path d="M10.5 19a1.8 1.8 0 0 0 3 0" strokeLinecap="round" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" {...S}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" strokeLinecap="round" />
    </svg>
  );
}
