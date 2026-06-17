import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import FooterNewsletter from "./FooterNewsletter";

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

        {/* Top row: brand + nav columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5 md:gap-10">

          {/* Brand — spans full row on mobile */}
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 md:col-span-1">
            <Link href="/" className="font-sans text-xl font-extrabold tracking-tight text-white">
              Seg<span className="italic text-[#12956A]">report</span>
            </Link>
            <p className="font-sans text-sm leading-relaxed text-white/60">
              Notícias, dados e ferramentas para o mercado segurador brasileiro.
            </p>
          </div>

          {/* Notícias */}
          <nav aria-label="Notícias por categoria" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-white/40">
              Notícias
            </h2>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.key}>
                  <Link href={`/${cat.key}`} className="font-sans text-sm text-white/70 transition-colors hover:text-white">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Ferramentas */}
          <nav aria-label="Ferramentas" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-white/40">
              Ferramentas
            </h2>
            <ul className="flex flex-col gap-2">
              {TOOLS_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-sans text-sm text-white/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Empresa */}
          <nav aria-label="Empresa" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-white/40">
              Empresa
            </h2>
            <ul className="flex flex-col gap-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-sans text-sm text-white/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-white/40">
              Legal
            </h2>
            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-sans text-sm text-white/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Newsletter */}
        <div className="mt-10 border-t border-white/10 pt-8">
          <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#12956A]">
            Newsletter semanal
          </h2>
          <div className="max-w-md">
            <FooterNewsletter />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Segreport. Todos os direitos reservados.</p>
          <p>Dados: SUSEP · BCB · IBGE</p>
        </div>
      </div>
    </footer>
  );
}
