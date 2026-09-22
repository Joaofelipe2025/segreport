import Link from "next/link";
import { formatDateLong } from "@/lib/format";
import Logo from "@/components/ui/Logo";

/**
 * Cabeçalho do portal.
 *
 * Verde-escuro com o logo centralizado, como no protótipo. A data do dia
 * fica à esquerda porque veículo de notícia se datar é sinal de frescor —
 * é a primeira coisa que o leitor profissional confere.
 */
export default function Header() {
  const today = formatDateLong(new Date());

  return (
    <header className="bg-forest-800 text-white">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        <p className="pt-3 text-[11px] font-medium capitalize text-forest-300 lg:text-xs">
          {today}
        </p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pb-4 pt-2">
          {/* Busca */}
          <div className="hidden lg:block">
            <SearchBox />
          </div>

          {/* Logo */}
          <Link
            href="/"
            className="col-start-1 justify-self-start lg:col-start-2 lg:justify-self-center"
            aria-label="SegReport — ir para a home"
          >
            <Logo variant="dark" className="h-7 lg:h-9" title="" />
          </Link>

          {/* Sessão */}
          <div className="col-start-3 flex items-center justify-end gap-2 lg:gap-4">
            <Link
              href="/login"
              className="hidden items-center gap-1.5 text-sm font-medium text-forest-100 transition-colors hover:text-white sm:flex"
            >
              <UserIcon />
              Entrar
            </Link>
            <Link
              href="/premium"
              className="rounded-full border border-white/35 px-4 py-2 text-xs font-semibold tracking-wide transition-colors hover:border-lime-400 hover:bg-lime-400 hover:text-forest-800 lg:px-5 lg:text-sm"
            >
              Assinar
            </Link>
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}

function SearchBox() {
  return (
    <form action="/busca" role="search" className="relative max-w-[260px]">
      <label htmlFor="busca-portal" className="sr-only">
        Buscar no SegReport
      </label>
      <SearchIcon />
      <input
        id="busca-portal"
        name="q"
        type="search"
        placeholder="Buscar..."
        className="w-full rounded-lg border border-white/15 bg-white/8 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-forest-300 focus:border-lime-400/60 focus:bg-white/12"
      />
    </form>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-300"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}
