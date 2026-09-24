"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { itensDeMenu, type Role } from "@/lib/auth/rules";

/**
 * Barra lateral escura do painel.
 *
 * Escolhida no brainstorming em vez de navegação horizontal: o painel nasce
 * com várias seções e vai receber Hub, anúncios e SUSEP. Vertical cresce,
 * horizontal não. E o contraste com a área clara evita a ambiguidade de
 * parecer o site público — um clique distraído nunca deixa dúvida sobre onde
 * você está.
 *
 * Esconder o que o papel não alcança é conveniência. A barreira é a RLS.
 */
export default function Sidebar({ papel, email }: { papel: Role; email: string }) {
  const pathname = usePathname();
  const itens = itensDeMenu(papel);

  return (
    <aside className="flex w-full shrink-0 flex-col bg-forest-900 px-3 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:py-4">
      <Link href="/admin" className="mb-1 block px-2 py-1 lg:mb-6">
        <Logo variant="dark" className="h-6" />
      </Link>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {itens.map((item) => {
          const ativo = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                ativo
                  ? "bg-forest-700 text-lime-400"
                  : "text-forest-300 hover:bg-forest-800 hover:text-white"
              }`}
            >
              {item.rotulo}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-white/10 pt-4 lg:block">
        <p className="truncate px-3 text-[11px] text-forest-500" title={email}>
          {email}
        </p>
        <Link
          href="/"
          className="mt-2 block px-3 text-xs font-medium text-forest-300 transition-colors hover:text-lime-400"
        >
          ← Ver o portal
        </Link>
      </div>
    </aside>
  );
}
