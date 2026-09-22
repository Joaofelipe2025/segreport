import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anuncie no SegReport",
  description:
    "Formatos, audiência e espaços publicitários do portal de inteligência do mercado segurador.",
};

/**
 * Página comercial.
 *
 * Os formatos listados abaixo correspondem aos slots reais que o ad server
 * do sub-projeto 3 vai servir — os mesmos nomes aparecem nos espaços
 * reservados espalhados pelo portal.
 */
const FORMATS = [
  {
    slot: "home-leaderboard",
    name: "Faixa da home",
    spec: "1200×180 · topo da home, abaixo da vitrine",
    note: "Maior alcance do portal. Um anunciante por semana.",
  },
  {
    slot: "home-sidebar-1",
    name: "Retângulo da coluna",
    spec: "300×250 · coluna lateral, todas as páginas editoriais",
    note: "Acompanha a rolagem. Segmentável por categoria.",
  },
  {
    slot: "article-sidebar-1",
    name: "Retângulo de matéria",
    spec: "300×250 · topo da coluna na página de notícia",
    note: "Alta atenção — o leitor chegou por interesse no tema.",
  },
  {
    slot: "in-feed",
    name: "Nativo no fluxo",
    spec: "Cartão entre matérias, com selo de publicidade",
    note: "Conteúdo patrocinado identificado, sem disfarce editorial.",
  },
  {
    slot: "newsletter",
    name: "Newsletter diária",
    spec: "Bloco fixo no corpo do e-mail das 7h",
    note: "Base profissional qualificada do setor.",
  },
  {
    slot: "hub-sidebar",
    name: "Hub Inteligência",
    spec: "300×250 · apenas para leitores do plano gratuito",
    note: "Assinantes PRO e Corporate não veem anúncios.",
  },
];

export default function AnunciePage() {
  return (
    <>
      <section className="bg-forest-800 text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-14 lg:px-8 lg:py-20">
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
            Fale com quem <span className="text-lime-400">decide</span> no mercado
            segurador
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-forest-200">
            Corretores, subscritores, atuários e executivos de seguradora. Nosso
            inventário é vendido direto, sem intermediário programático — você
            sabe exatamente onde sua marca aparece.
          </p>
          <Link
            href="/contato?assunto=midia"
            className="mt-8 inline-block rounded-full bg-lime-400 px-7 py-3.5 text-xs font-extrabold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500"
          >
            Solicitar mídia kit
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8 lg:py-16">
        <h2 className="mb-6 border-l-[4px] border-lime-400 pl-4 text-2xl font-bold tracking-[-0.02em] text-ink">
          Formatos disponíveis
        </h2>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FORMATS.map((format) => (
            <article
              key={format.slot}
              className="flex min-h-[172px] flex-col justify-between rounded-xl border border-hairline bg-white p-6"
            >
              <div>
                <h3 className="text-base font-bold text-ink">{format.name}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{format.spec}</p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink-3">
                  {format.note}
                </p>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-ink-4">
                slot: {format.slot}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-forest-800 p-7 text-white sm:p-9">
          <h2 className="text-xl font-bold">Sem script de terceiro</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-forest-200">
            O SegReport serve a publicidade pelo próprio sistema. Isso significa
            páginas mais rápidas para o leitor, controle total sobre quem
            anuncia ao lado do nosso conteúdo, e relatório de impressões e
            cliques direto da fonte — sem depender de painel de outra empresa.
          </p>
        </div>
      </div>
    </>
  );
}
