"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  label: string;
  href: string;
}

const TABS: Tab[] = [
  { label: "Tudo", href: "/" },
  { label: "Auto", href: "/auto" },
  { label: "Vida", href: "/vida" },
  { label: "Saúde", href: "/saude" },
  { label: "Agro", href: "/agro" },
  { label: "Resseguros", href: "/resseguros" },
  { label: "Regulação", href: "/regulacao" },
  { label: "Tech", href: "/tech" },
];

export default function CategoryTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Categorias de notícias"
      style={{
        position: "sticky",
        top: 60,
        zIndex: 40,
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <ul
        className="no-scrollbar"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          overflowX: "auto",
          listStyle: "none",
        }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <li key={tab.href} style={{ flexShrink: 0 }}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: "block",
                  padding: "13px 16px",
                  whiteSpace: "nowrap",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--green)" : "var(--ink-3)",
                  borderBottom: isActive ? "2px solid var(--green-2)" : "2px solid transparent",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
