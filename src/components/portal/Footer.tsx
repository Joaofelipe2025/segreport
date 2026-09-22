import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-forest-900 text-forest-300">
      <div className="mx-auto max-w-[1400px] px-4 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-extrabold italic tracking-[-0.03em] text-white">
              segreport
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              Notícias, dados e inteligência para profissionais do mercado
              segurador brasileiro.
            </p>
            <p className="mt-5 text-xs leading-relaxed text-forest-500">
              Os indicadores publicados trazem fonte e data de apuração.
              Onde não há medição para o período, exibimos travessão — nunca zero.
            </p>
          </div>

          <FooterColumn title="Editorias">
            {CATEGORIES.slice(0, 6).map((c) => (
              <FooterLink key={c.slug} href={`/${c.slug}`}>
                {c.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Produto">
            <FooterLink href="/hub">Hub Inteligência</FooterLink>
            <FooterLink href="/hub/rankings">Rankings</FooterLink>
            <FooterLink href="/hub/radar">Radar</FooterLink>
            <FooterLink href="/hub/relatorios">Relatórios</FooterLink>
            <FooterLink href="/premium">Planos e assinatura</FooterLink>
          </FooterColumn>

          <FooterColumn title="SegReport">
            <FooterLink href="/colunistas">Colunistas</FooterLink>
            <FooterLink href="/flash">Flash do Mercado</FooterLink>
            <FooterLink href="/eventos">Eventos</FooterLink>
            <FooterLink href="/anuncie">Anuncie</FooterLink>
            <FooterLink href="/contato">Contato</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} SegReport. Todos os direitos reservados.</p>
          <div className="flex gap-5">
            <Link href="/termos" className="transition-colors hover:text-lime-400">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-lime-400">
              Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white">
        {title}
      </p>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition-colors hover:text-lime-400">
        {children}
      </Link>
    </li>
  );
}
