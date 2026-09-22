import type { Metadata } from "next";
import Header from "@/components/portal/Header";
import Nav from "@/components/portal/Nav";
import Footer from "@/components/portal/Footer";
import HubTabs from "@/components/hub/HubTabs";

export const metadata: Metadata = {
  title: {
    default: "Hub Inteligência",
    template: "%s · Hub Inteligência · SegReport",
  },
  description:
    "Indicadores por ramo, rankings de seguradoras, radar regulatório e relatórios do mercado segurador brasileiro.",
  // O Hub depende do plano de quem pede, então a página não pode ser
  // cacheada por buscador nem por cache compartilhado.
  robots: { index: false, follow: true },
};

/**
 * O Hub inteiro é renderizado a cada requisição.
 *
 * O conteúdo depende do plano de quem pede, então nenhuma página daqui pode
 * ser pré-renderizada nem guardada em cache compartilhado — seria servir o
 * nível de acesso de um usuário para outro. Sem esta linha o Next
 * pré-renderiza as telas que hoje não leem `searchParams`, porque
 * `getCurrentTier()` ainda devolve valor constante; quando a autenticação
 * entrar, essas páginas ficariam congeladas no nível errado.
 */
export const dynamic = "force-dynamic";

/**
 * Casca do Hub Inteligência.
 *
 * Tratamento híbrido aprovado no brainstorming: a página é clara, os blocos
 * de dado são verde-escuros. Não há ticker aqui — dentro do Hub o indicador
 * é o conteúdo principal, e repetir a faixa seria ruído.
 */
export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header />
      <Nav />

      <div className="relative overflow-hidden bg-gradient-to-br from-forest-800 via-forest-800 to-forest-900 text-white">
        {/* Halo de marca — dá profundidade à faixa sem pedir atenção */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lime-400/8 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex max-w-[1400px] items-center gap-3.5 px-4 py-5 sm:gap-4 sm:py-7 lg:px-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400 text-forest-800 shadow-[0_6px_18px_rgba(178,224,47,0.28)] sm:h-11 sm:w-11">
            <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" aria-hidden="true">
              <path d="M13 2 4.5 13.2h5.8L10 22l8.8-11.6h-6.1z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-[-0.02em] sm:text-2xl">
              Hub Inteligência
            </h1>
            <p className="mt-0.5 text-xs text-forest-300 sm:text-sm">
              Análises exclusivas do mercado segurador brasileiro
            </p>
          </div>
        </div>
      </div>

      <HubTabs />

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
