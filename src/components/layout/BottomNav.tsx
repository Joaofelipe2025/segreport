"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = React.SVGProps<SVGSVGElement>;

function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function MarketIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19V10M10 19V5M16 19v-7M21 19H3" />
    </svg>
  );
}

function ToolsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 6.5 18 3l3 3-3.5 3.5M9 9 4 14a2.5 2.5 0 0 0 3.5 3.5L12.5 13" />
      <path d="m12 11 5.5 5.5a2 2 0 0 0 2.8-2.8L14.8 8.2" />
    </svg>
  );
}

function AiIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function ProfileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  );
}

interface NavItem {
  label: string;
  href: string;
  Icon: (props: IconProps) => React.ReactElement;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/", Icon: HomeIcon },
  { label: "Mercado", href: "/mercado", Icon: MarketIcon },
  { label: "Ferramentas", href: "/ferramentas", Icon: ToolsIcon },
  { label: "IA", href: "/ia", Icon: AiIcon },
  { label: "Perfil", href: "/login", Icon: ProfileIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação inferior"
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        background: "rgba(255,255,255,.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_ITEMS.map(({ label, href, Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "10px 0",
            }}
          >
            <Icon
              style={{
                width: 22,
                height: 22,
                stroke: isActive ? "var(--green)" : "var(--ink-4)",
              }}
            />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: isActive ? "var(--green)" : "var(--ink-4)",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
