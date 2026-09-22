"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PRIMARY_CATEGORIES, SECONDARY_CATEGORIES } from "@/lib/categories";

/**
 * Barra de navegação branca, logo abaixo do cabeçalho verde.
 *
 * Cliente porque destaca a rota ativa e abre o submenu. O submenu responde a
 * foco além de hover, para funcionar por teclado.
 */
export default function Nav() {
  const pathname = usePathname();
  const [openSub, setOpenSub] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    [
      "relative py-4 text-sm font-semibold transition-colors",
      isActive(href)
        ? "text-forest-800 after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-lime-400"
        : "text-ink-2 hover:text-forest-700",
    ].join(" ");

  return (
    <nav className="sticky top-0 z-40 border-b border-hairline bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 lg:justify-center lg:px-8">
        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          aria-expanded={openMobile}
          aria-label="Abrir menu"
          className="py-4 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <div className="hidden items-center gap-6 lg:flex xl:gap-7">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <Link href="/noticias" className={linkClass("/noticias")}>
            Novidades
          </Link>

          {PRIMARY_CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className={linkClass(`/${c.slug}`)}>
              {c.label}
            </Link>
          ))}

          {/* Submenu das categorias secundárias */}
          <div
            className="relative"
            onMouseEnter={() => setOpenSub(true)}
            onMouseLeave={() => setOpenSub(false)}
          >
            <button
              type="button"
              onClick={() => setOpenSub((v) => !v)}
              aria-expanded={openSub}
              className="flex items-center gap-1.5 py-4 text-sm font-semibold text-ink-2 transition-colors hover:text-forest-700"
            >
              Regulação &amp; Seguros
              <svg
                viewBox="0 0 24 24"
                className={`h-3.5 w-3.5 transition-transform ${openSub ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {openSub && (
              <div className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 overflow-hidden rounded-xl border border-hairline bg-white py-2 shadow-[0_18px_40px_rgba(14,31,20,0.16)]">
                {SECONDARY_CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="block px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-forest-100 hover:text-forest-800"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/flash" className={linkClass("/flash")}>
            Flash do Mercado
          </Link>
          <Link href="/eventos" className={linkClass("/eventos")}>
            Eventos
          </Link>

          <HubButton />
        </div>

        {/* Mobile: só o botão do Hub fica sempre visível */}
        <div className="ml-auto py-2.5 lg:hidden">
          <HubButton compact />
        </div>
      </div>

      {openMobile && (
        <div className="border-t border-hairline bg-white px-4 pb-4 lg:hidden">
          <div className="grid grid-cols-2 gap-x-4">
            <Link href="/" className="border-b border-hairline py-3 text-sm font-semibold">
              Home
            </Link>
            <Link href="/noticias" className="border-b border-hairline py-3 text-sm font-semibold">
              Novidades
            </Link>
            {[...PRIMARY_CATEGORIES, ...SECONDARY_CATEGORIES].map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="border-b border-hairline py-3 text-sm font-medium text-ink-2"
              >
                {c.label}
              </Link>
            ))}
            <Link href="/flash" className="border-b border-hairline py-3 text-sm font-medium text-ink-2">
              Flash do Mercado
            </Link>
            <Link href="/eventos" className="border-b border-hairline py-3 text-sm font-medium text-ink-2">
              Eventos
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function HubButton({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/hub"
      className={`inline-flex items-center gap-2 rounded-full bg-lime-400 font-extrabold uppercase tracking-[0.04em] text-forest-800 transition-all hover:bg-lime-500 hover:shadow-[0_6px_18px_rgba(178,224,47,0.45)] ${
        compact ? "px-3.5 py-2 text-[11px]" : "px-5 py-2.5 text-xs"
      }`}
    >
      <BoltIcon />
      Hub Inteligência
    </Link>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M13 2 4.5 13.2h5.8L10 22l8.8-11.6h-6.1z" />
    </svg>
  );
}
