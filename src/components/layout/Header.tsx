"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Mercado", href: "/mercado" },
  { label: "Ferramentas", href: "/ferramentas" },
  { label: "IA", href: "/ia" },
  { label: "SUSEP", href: "/dados-susep" },
];

const CATEGORY_HREFS = CATEGORIES.map((c) => `/${c.key}`);

type IconProps = React.SVGProps<SVGSVGElement>;

function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...props}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isNoticiasActive = pathname === "/" || CATEGORY_HREFS.includes(pathname);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 60,
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 20px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Segreport — página inicial"
          style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, lineHeight: 1 }}
        >
          <span style={{ color: "var(--ink)" }}>Seg</span>
          <span style={{ color: "var(--green)", fontStyle: "italic" }}>report</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Navegação principal" className="hidden md:block" style={{ flex: 1 }}>
          <ul style={{ display: "flex", alignItems: "center", gap: 4, listStyle: "none" }}>
            {/* Notícias dropdown */}
            <li style={{ position: "relative" }} className="group">
              <Link
                href="/"
                aria-current={isNoticiasActive ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: isNoticiasActive ? "var(--green)" : "var(--ink-3)",
                  background: isNoticiasActive ? "var(--green-bg)" : "transparent",
                  transition: "background 0.15s, color 0.15s",
                }}
                className={!isNoticiasActive ? "hover:bg-[var(--green-bg)] hover:!text-[var(--green)]" : ""}
              >
                Notícias
                <ChevronDownIcon style={{ width: 12, height: 12 }} className="transition-transform group-hover:rotate-180" />
              </Link>
              {/* Dropdown */}
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 50,
                  width: 200,
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 6,
                  boxShadow: "0 8px 24px rgba(0,0,0,.10)",
                  marginTop: 4,
                }}
                className="invisible opacity-0 translate-y-[-4px] transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0"
              >
                <ul style={{ listStyle: "none" }}>
                  {CATEGORIES.map((cat) => {
                    const href = `/${cat.key}`;
                    const isActive = pathname === href;
                    return (
                      <li key={cat.key}>
                        <Link
                          href={href}
                          aria-current={isActive ? "page" : undefined}
                          style={{
                            display: "block",
                            padding: "7px 10px",
                            borderRadius: 6,
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? "var(--green)" : "var(--ink-2)",
                            background: isActive ? "var(--green-bg)" : "transparent",
                            transition: "background 0.12s, color 0.12s",
                          }}
                          className={!isActive ? "hover:bg-[var(--green-bg)] hover:!text-[var(--green)]" : ""}
                        >
                          {cat.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>

            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      display: "block",
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      color: isActive ? "var(--green)" : "var(--ink-3)",
                      background: isActive ? "var(--green-bg)" : "transparent",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    className={!isActive ? "hover:bg-[var(--green-bg)] hover:!text-[var(--green)]" : ""}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 8, flexShrink: 0 }}>
          {searchOpen && (
            <label style={{ display: "contents" }}>
              <span className="sr-only">Buscar notícias</span>
              <input
                type="search"
                autoFocus
                placeholder="Buscar notícias..."
                style={{
                  width: 192,
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  padding: "6px 14px",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 13,
                  color: "var(--ink)",
                  outline: "none",
                  background: "var(--white)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--green)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
            </label>
          )}

          <button
            type="button"
            aria-label={searchOpen ? "Fechar busca" : "Buscar"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              color: "var(--ink)",
              transition: "color 0.15s",
            }}
            className="hover:!text-[var(--green)]"
          >
            <SearchIcon style={{ width: 16, height: 16 }} />
          </button>

          {/* Ao vivo badge */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--green-bg)",
              color: "var(--green)",
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              padding: "4px 10px",
              borderRadius: 999,
              letterSpacing: "0.04em",
            }}
          >
            <span
              className="animate-blink"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-2)", flexShrink: 0 }}
              aria-hidden="true"
            />
            Ao vivo
          </span>

          <Link
            href="/login"
            className="hidden lg:block"
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              fontFamily: "'Poppins', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink)",
              transition: "border-color 0.15s",
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--green)"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"; }}
          >
            Entrar
          </Link>

          <Link
            href="/premium"
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              background: "var(--green)",
              fontFamily: "'Poppins', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              transition: "opacity 0.15s",
            }}
            className="hover:opacity-90"
          >
            Premium ↗
          </Link>
        </div>

        {/* Hamburger */}
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            color: "var(--ink)",
          }}
        >
          {open ? <CloseIcon style={{ width: 20, height: 20 }} /> : <MenuIcon style={{ width: 20, height: 20 }} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          style={{
            background: "var(--white)",
            borderTop: "1px solid var(--border)",
            padding: "16px 20px 20px",
          }}
          className="md:hidden"
        >
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
            <li>
              <Link
                href="/"
                aria-current={isNoticiasActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 14,
                  fontWeight: isNoticiasActive ? 600 : 400,
                  color: isNoticiasActive ? "var(--green)" : "var(--ink)",
                }}
              >
                Notícias
              </Link>
              <ul style={{ listStyle: "none", marginTop: 8, paddingLeft: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const href = `/${cat.key}`;
                  const isActive = pathname === href;
                  return (
                    <li key={cat.key}>
                      <Link
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "var(--green)" : "var(--ink-3)",
                        }}
                      >
                        {cat.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--green)" : "var(--ink)",
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                fontFamily: "'Poppins', sans-serif",
                fontSize: 14,
                color: "var(--ink)",
              }}
            >
              Entrar
            </Link>
            <Link
              href="/premium"
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 16px",
                borderRadius: 999,
                background: "var(--green)",
                fontFamily: "'Poppins', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              Premium ↗
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
