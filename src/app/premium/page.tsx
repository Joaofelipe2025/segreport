import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Segreport Premium | Assinatura para profissionais do mercado segurador",
  description:
    "Conheça os planos Segreport Premium: dashboard de mercado, alertas de circulares, relatórios setoriais exclusivos e assistente de IA ilimitado.",
};

type PlanId = "gratis" | "mensal" | "anual";

interface PlanFeature {
  label: string;
  includedIn: PlanId[];
}

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  highlight: boolean;
  badge?: string;
  ctaLabel: string;
}

const PLANS: Plan[] = [
  {
    id: "gratis",
    name: "Grátis",
    price: "R$0",
    period: "/sempre",
    highlight: false,
    ctaLabel: "Continuar grátis",
  },
  {
    id: "mensal",
    name: "Premium Mensal",
    price: "R$97",
    period: "/mês",
    highlight: true,
    badge: "Mais popular",
    ctaLabel: "Começar 7 dias grátis",
  },
  {
    id: "anual",
    name: "Premium Anual",
    price: "R$797",
    period: "/ano",
    highlight: false,
    badge: "2 meses grátis",
    ctaLabel: "Assinar plano anual",
  },
];

const FEATURES: PlanFeature[] = [
  { label: "Acesso a notícias", includedIn: ["gratis", "mensal", "anual"] },
  { label: "Dashboard de mercado", includedIn: ["mensal", "anual"] },
  { label: "Alertas de circulares em tempo real", includedIn: ["mensal", "anual"] },
  { label: "Relatórios setoriais exclusivos", includedIn: ["anual"] },
  { label: "Assistente de IA ilimitado", includedIn: ["mensal", "anual"] },
  { label: "Ferramentas premium completas", includedIn: ["anual"] },
  { label: "Calculadoras e simuladores básicos", includedIn: ["gratis", "mensal", "anual"] },
  { label: "Suporte prioritário", includedIn: ["anual"] },
];

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  color: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marina Costa",
    role: "Corretora de seguros, São Paulo",
    initials: "MC",
    color: "#0D6E4F",
    quote:
      "Os alertas de circulares em tempo real mudaram minha rotina. Hoje fico sabendo de mudanças regulatórias antes mesmo de meus clientes perguntarem.",
  },
  {
    name: "Rafael Oliveira",
    role: "Corretor de seguros, Belo Horizonte",
    initials: "RO",
    color: "#12956A",
    quote:
      "O assistente de IA ilimitado é como ter um analista de mercado disponível 24 horas. Uso para preparar reuniões com clientes corporativos.",
  },
  {
    name: "Juliana Almeida",
    role: "Gestora de corretora, Porto Alegre",
    initials: "JA",
    color: "#1A1A18",
    quote:
      "Os relatórios setoriais exclusivos viraram material padrão nas nossas apresentações comerciais. O retorno em credibilidade com clientes é imediato.",
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim. A assinatura Premium não tem fidelidade e pode ser cancelada a qualquer momento diretamente no seu painel de conta, sem multas ou burocracia.",
  },
  {
    question: "Como funciona o período de teste gratuito?",
    answer:
      "Você tem 7 dias completos de acesso a todos os recursos do plano escolhido, sem cobrança. Se cancelar antes do fim do período, não será cobrado nada.",
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer:
      "Aceitamos cartão de crédito, débito recorrente e Pix para assinaturas anuais. Todos os pagamentos são processados em ambiente seguro.",
  },
  {
    question: "O acesso é individual ou para a equipe toda?",
    answer:
      "O plano padrão é individual. Para corretoras com múltiplos usuários, oferecemos planos corporativos com gestão centralizada de licenças — fale com nosso time comercial.",
  },
  {
    question: "Os dados são atualizados com que frequência?",
    answer:
      "Indicadores de mercado e alertas regulatórios são atualizados continuamente, à medida que a SUSEP e demais órgãos publicam novas informações.",
  },
  {
    question: "Existe desconto para corretoras com múltiplos usuários?",
    answer:
      "Sim. Corretoras com mais de 5 usuários têm acesso a tabelas de desconto progressivo. Entre em contato com nosso time para uma proposta personalizada.",
  },
];

function FeatureMark({ included }: { included: boolean }) {
  if (included) {
    return (
      <span className="text-[#0D6E4F]" aria-hidden="true">
        ✓
      </span>
    );
  }
  return (
    <span className="text-[#A8A8A3]" aria-hidden="true">
      ✗
    </span>
  );
}

export default function PremiumPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <section aria-label="Introdução ao Segreport Premium" className="mb-14 max-w-3xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#0D6E4F]">
          Segreport Premium
        </p>
        <h1 className="mt-3 font-sans text-[36px] font-extrabold leading-[42px] text-[#1A1A18] md:text-[56px] md:leading-[60px]">
          Tudo o que você precisa para dominar o mercado segurador
        </h1>
        <p className="mt-4 font-sans text-[16px] leading-relaxed text-[#3D3D3A] md:text-[18px]">
          Dados da SUSEP, alertas regulatórios, relatórios exclusivos e um assistente de
          IA especializado — em um único lugar, feito para corretores e profissionais do
          setor de seguros.
        </p>
      </section>

      <section aria-label="Planos disponíveis" className="mb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={
                plan.highlight
                  ? "relative flex flex-col rounded-2xl border-[3px] border-[#0D6E4F] bg-white p-6"
                  : "relative flex flex-col rounded-2xl border border-[rgba(0,0,0,.08)] bg-white p-6"
              }
            >
              {plan.badge && (
                <span
                  className={
                    plan.highlight
                      ? "absolute -top-3 left-6 inline-flex items-center rounded-full bg-[#0D6E4F] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-white"
                      : "absolute -top-3 left-6 inline-flex items-center rounded-full bg-[#1A1A18] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-white"
                  }
                >
                  {plan.badge}
                </span>
              )}

              <h2 className="mt-2 font-sans text-[18px] font-bold text-[#1A1A18]">
                {plan.name}
              </h2>

              <p className="mt-3 flex items-baseline gap-1">
                <span className="font-sans text-[40px] font-extrabold text-[#1A1A18]">
                  {plan.price}
                </span>
                <span className="font-sans text-[14px] font-normal text-[#76766F]">
                  {plan.period}
                </span>
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {FEATURES.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-start gap-2 font-sans text-[14px] text-[#3D3D3A]"
                  >
                    <FeatureMark included={feature.includedIn.includes(plan.id)} />
                    {feature.label}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={
                  plan.highlight
                    ? "mt-8 w-full rounded-full bg-[#0D6E4F] py-3 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                    : "mt-8 w-full rounded-full border border-[#1A1A18] py-3 font-sans text-[14px] font-semibold text-[#1A1A18] transition-colors hover:bg-[#1A1A18] hover:text-white"
                }
              >
                {plan.ctaLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Depoimentos de corretores" className="mb-16">
        <h2 className="mb-6 font-sans text-[24px] font-bold text-[#1A1A18]">
          O que dizem os corretores que usam o Premium
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex flex-col gap-4 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full font-sans text-[14px] font-bold text-white"
                  style={{ backgroundColor: testimonial.color }}
                  aria-hidden="true"
                >
                  {testimonial.initials}
                </span>
                <div>
                  <p className="font-sans text-[14px] font-semibold text-[#1A1A18]">
                    {testimonial.name}
                  </p>
                  <p className="font-sans text-[12px] text-[#76766F]">{testimonial.role}</p>
                </div>
              </div>
              <p className="font-sans text-[14px] leading-relaxed text-[#3D3D3A]">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Perguntas frequentes" className="mb-16 max-w-3xl">
        <h2 className="mb-6 font-sans text-[24px] font-bold text-[#1A1A18]">
          Perguntas frequentes
        </h2>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-[rgba(0,0,0,.08)] bg-white px-5 py-4"
            >
              <summary className="cursor-pointer list-none font-sans text-[15px] font-semibold text-[#1A1A18]">
                {item.question}
              </summary>
              <p className="mt-3 font-sans text-[14px] leading-relaxed text-[#3D3D3A]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section aria-label="Chamada final para assinatura">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-[#1A1A18] px-6 py-12 text-center md:px-12">
          <h2 className="font-sans text-[26px] font-extrabold text-white md:text-[34px]">
            Pronto para dominar o mercado segurador?
          </h2>
          <p className="max-w-xl font-sans text-[15px] text-[#E6F2ED]">
            Comece agora seu período de testes gratuito e tenha acesso completo a todos
            os recursos Premium, sem compromisso.
          </p>
          <button
            type="button"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-[#0D6E4F] px-8 py-4 font-sans text-[16px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Começar 7 dias grátis
          </button>
        </div>
      </section>
    </main>
  );
}
