import Link from "next/link";
import type { Metadata } from "next";
import { LockIcon } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Planos e assinatura",
  description:
    "Free, PRO e Corporate: escolha o acesso ao Hub Inteligência do SegReport.",
};

const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    pitch: "Para acompanhar o noticiário do setor.",
    features: [
      "Todas as notícias e colunas abertas",
      "Newsletter diária",
      "Indicadores de prêmio dos 6 ramos",
      "Top 3 de cada ranking",
      "Radar com sinais de impacto médio e baixo",
    ],
    absent: ["Sinistralidade e market share", "Série histórica", "Exportação e relatórios"],
    cta: "Criar conta grátis",
    href: "/cadastro",
    highlight: false,
  },
  {
    id: "pro",
    name: "PRO",
    price: "R$ 89",
    period: "por mês",
    pitch: "Para quem precisa do número antes da reunião.",
    features: [
      "Tudo do plano gratuito",
      "Hub Inteligência completo",
      "Top 20 de todos os rankings",
      "Sinistralidade, reajuste e market share",
      "Série histórica de 5 anos",
      "Exportação em CSV e relatórios em PDF",
      "Alertas por variação de indicador",
      "Navegação sem anúncios",
    ],
    absent: [],
    cta: "Assinar PRO",
    href: "/cadastro?plano=pro",
    highlight: true,
  },
  {
    id: "corporate",
    name: "Corporate",
    price: "Sob consulta",
    period: "faturamento anual",
    pitch: "Para times de seguradora, corretora e consultoria.",
    features: [
      "Tudo do plano PRO",
      "Múltiplos assentos por contrato",
      "Indicadores de concentração de mercado",
      "Relatórios sob demanda",
      "Acesso à API de dados",
      "Gestor de conta dedicado",
    ],
    absent: [],
    cta: "Falar com vendas",
    href: "/contato?assunto=corporate",
    highlight: false,
  },
];

export default function PremiumPage() {
  return (
    <>
      <section className="bg-forest-800 text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-10 text-center sm:py-14 lg:px-8 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-700 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-400">
            <LockIcon className="h-3 w-3" />
            Hub Inteligência
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-[32px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
            O dado do mercado segurador,{" "}
            <span className="text-lime-400">rastreável até a fonte</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-forest-200">
            Indicadores por ramo, rankings de seguradoras e radar regulatório.
            Cada número com fonte e data de apuração declaradas.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl p-7 ${
                plan.highlight
                  ? "bg-forest-800 text-white ring-2 ring-lime-400"
                  : "border border-hairline bg-white"
              }`}
            >
              {plan.highlight && (
                <span className="mb-4 inline-block self-start rounded-full bg-lime-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-forest-800">
                  Mais escolhido
                </span>
              )}

              <h2
                className={`text-lg font-semibold uppercase tracking-[0.08em] ${
                  plan.highlight ? "text-lime-400" : "text-forest-700"
                }`}
              >
                {plan.name}
              </h2>
              <p
                className={`mt-1.5 text-sm ${plan.highlight ? "text-forest-200" : "text-ink-3"}`}
              >
                {plan.pitch}
              </p>

              <p className="mt-6 flex items-baseline gap-2">
                <span
                  className={`text-4xl font-bold tracking-[-0.03em] ${
                    plan.highlight ? "text-white" : "text-ink"
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-xs ${plan.highlight ? "text-forest-300" : "text-ink-4"}`}
                >
                  {plan.period}
                </span>
              </p>

              <ul className="mt-7 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex gap-2.5 text-sm leading-snug ${
                      plan.highlight ? "text-forest-100" : "text-ink-2"
                    }`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.highlight ? "text-lime-400" : "text-forest-600"}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <path d="m3 8.5 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feature}
                  </li>
                ))}

                {plan.absent.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-snug text-ink-4">
                    <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-7 block rounded-lg py-3.5 text-center text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
                  plan.highlight
                    ? "bg-lime-400 text-forest-800 hover:bg-lime-500"
                    : "bg-forest-800 text-white hover:bg-forest-700"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-ink-3">
          Os valores acima são de demonstração. O checkout entra no sub-projeto
          de monetização, junto com o portal de cobrança e a gestão de assentos
          do plano Corporate.
        </p>
      </div>
    </>
  );
}
