import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

interface FooterLink {
  label: string;
  href: string;
}

const TOOLS_LINKS: FooterLink[] = [
  { label: "Calculadora de comissão", href: "/ferramentas/calculadora-comissao" },
  { label: "Hub de ferramentas", href: "/ferramentas" },
  { label: "Hub de IA", href: "/ia" },
  { label: "Dados SUSEP", href: "/dados-susep" },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
  { label: "Anuncie", href: "/anuncie" },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "Privacidade", href: "/privacidade" },
  { label: "Termos de uso", href: "/termos" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1A1A18] text-white">
      <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-xs flex-col gap-3">
            <Link href="/" className="font-sans text-xl font-extrabold tracking-tight text-white">
              Seg<span className="italic text-[#12956A]">report</span>
            </Link>
            <p className="font-sans text-sm text-white/60">
              Notícias, dados e ferramentas para o mercado segurador
              brasileiro.
            </p>
          </div>

          <nav aria-label="Notícias por categoria" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-white/40">
              Notícias
            </h2>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.map((category) => (
                <li key={category.key}>
                  <Link
                    href={`/${category.key}`}
                    className="font-sans text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Ferramentas" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-white/40">
              Ferramentas
            </h2>
            <ul className="flex flex-col gap-2">
              {TOOLS_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Empresa" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-white/40">
              Empresa
            </h2>
            <ul className="flex flex-col gap-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-white/40">
              Legal
            </h2>
            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 md:max-w-sm">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#12956A]">
            Newsletter semanal
          </h2>
          <form className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              E-mail
            </label>
            <input
              id="footer-newsletter-email"
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-sans text-sm text-white placeholder:text-white/40 focus:border-[#12956A] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-[#0D6E4F] px-4 py-2 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Assinar
            </button>
          </form>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Segreport. Todos os direitos reservados.</p>
          <p>Dados: SUSEP · BCB · IBGE</p>
        </div>
      </div>
    </footer>
  );
}
