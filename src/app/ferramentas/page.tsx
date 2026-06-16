import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ferramentas | Segreport",
  description:
    "Calculadoras, simuladores e utilitários para corretores e profissionais do mercado segurador brasileiro.",
};

type ToolBadge = "gratis" | "gratis-limitado" | "premium";

interface ToolItem {
  name: string;
  description: string;
  badge: ToolBadge;
  href: string;
}

const TOOLS: ToolItem[] = [
  {
    name: "Calculadora de comissão",
    description: "Simule comissão bruta, IR e receita líquida mensal e anual.",
    badge: "gratis",
    href: "/ferramentas/calculadora-comissao",
  },
  {
    name: "Calendário regulatório",
    description: "Acompanhe prazos e normas da SUSEP e demais órgãos reguladores.",
    badge: "gratis",
    href: "#",
  },
  {
    name: "Glossário de seguros",
    description: "Termos técnicos do mercado segurador explicados em linguagem simples.",
    badge: "gratis",
    href: "#",
  },
  {
    name: "Tradutor de linguagem técnica",
    description: "Converta jargão técnico de apólices em explicações para o cliente.",
    badge: "gratis-limitado",
    href: "#",
  },
  {
    name: "Estimador de prêmio",
    description: "Estime faixas de prêmio com base em perfil de risco e cobertura.",
    badge: "premium",
    href: "#",
  },
  {
    name: "Gerador de e-mail de prospecção",
    description: "Crie e-mails de prospecção personalizados em segundos.",
    badge: "premium",
    href: "#",
  },
  {
    name: "Analisador de perfil de risco",
    description: "Avalie o perfil de risco do segurado a partir de dados informados.",
    badge: "premium",
    href: "#",
  },
  {
    name: "Gerador de conteúdo social",
    description: "Crie posts para redes sociais sobre seguros em poucos cliques.",
    badge: "premium",
    href: "#",
  },
  {
    name: "Simulador pró-labore",
    description: "Simule retiradas de pró-labore e impacto tributário mensal.",
    badge: "premium",
    href: "#",
  },
  {
    name: "Comparador MEI vs Simples",
    description: "Compare regimes tributários para corretores autônomos.",
    badge: "premium",
    href: "#",
  },
  {
    name: "Calculadora de LTV",
    description: "Calcule o valor do tempo de vida do cliente em sua carteira.",
    badge: "premium",
    href: "#",
  },
  {
    name: "Benchmark de comissão",
    description: "Compare suas comissões com a média praticada no mercado.",
    badge: "premium",
    href: "#",
  },
];

function CalculatorIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="11" x2="8" y2="11" />
      <line x1="12" y1="11" x2="12" y2="11" />
      <line x1="16" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="8" y2="15" />
      <line x1="12" y1="15" x2="12" y2="15" />
      <line x1="16" y1="15" x2="16" y2="18" />
      <line x1="8" y1="18" x2="12" y2="18" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function TranslateIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h7" />
      <path d="M8.5 5.5v2.5C8.5 11.5 6 14 3 14" />
      <path d="M5 11c1.6 1.6 3.6 2.5 5 2.5" />
      <path d="M13 21l4-9 4 9" />
      <path d="M14.5 18h5" />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.9 19.1A9 9 0 1 1 19.1 19.1" />
      <line x1="12" y1="13" x2="15.5" y2="9" />
      <circle cx="12" cy="13" r="1" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l8 3.5v6c0 5-3.5 8.5-8 10.5-4.5-2-8-5.5-8-10.5v-6L12 2Z" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6l-4 4H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8a4 4 0 0 1 0 8" />
      <path d="M17 5a8 8 0 0 1 0 14" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="17" cy="14" r="1" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M5 7l-3 6a3 3 0 0 0 6 0Z" />
      <path d="M19 7l-3 6a3 3 0 0 0 6 0Z" />
      <line x1="5" y1="7" x2="19" y2="7" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="20" x2="20" y2="20" />
      <line x1="7" y1="20" x2="7" y2="12" />
      <line x1="12" y1="20" x2="12" y2="7" />
      <line x1="17" y1="20" x2="17" y2="14" />
    </svg>
  );
}

function BarsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="20" x2="5" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="19" y1="20" x2="19" y2="14" />
    </svg>
  );
}

const TOOL_ICONS: (() => React.ReactElement)[] = [
  CalculatorIcon,
  CalendarIcon,
  BookIcon,
  TranslateIcon,
  GaugeIcon,
  MailIcon,
  ShieldIcon,
  MegaphoneIcon,
  WalletIcon,
  ScaleIcon,
  ChartIcon,
  BarsIcon,
];

function BadgeTag({ badge }: { badge: ToolBadge }) {
  if (badge === "premium") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#1A1A18] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-white">
        Premium
      </span>
    );
  }
  if (badge === "gratis-limitado") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#E6F2ED] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-[#0D6E4F]">
        Grátis — 3x/dia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#E6F2ED] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-[#0D6E4F]">
      Grátis
    </span>
  );
}

export default function FerramentasPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section aria-label="Introdução às ferramentas" className="mb-10">
        <h1 className="font-sans text-[32px] font-extrabold leading-[44px] text-[#1A1A18]">
          Ferramentas
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-[15px] text-[#3D3D3A]">
          Calculadoras, simuladores e utilitários pensados para o dia a dia de
          corretores e profissionais do mercado segurador brasileiro.
        </p>
      </section>

      <section aria-label="Lista de ferramentas">
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, index) => {
            const Icon = TOOL_ICONS[index];
            const isPremium = tool.badge === "premium";
            return (
              <li key={tool.name}>
                <div className="flex h-full flex-col gap-4 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5 transition-colors hover:border-[#0D6E4F]">
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E6F2ED]"
                      aria-hidden="true"
                    >
                      <Icon />
                    </span>
                    <BadgeTag badge={tool.badge} />
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5">
                    <h2 className="font-sans text-[16px] font-bold leading-snug text-[#1A1A18]">
                      {tool.name}
                    </h2>
                    <p className="font-sans text-[13px] leading-snug text-[#3D3D3A]">
                      {tool.description}
                    </p>
                  </div>

                  <a
                    href={tool.href}
                    className={
                      isPremium
                        ? "inline-flex items-center justify-center rounded-lg border border-[#1A1A18] px-4 py-2 font-sans text-[14px] font-semibold text-[#1A1A18] transition-colors hover:bg-[#1A1A18] hover:text-white"
                        : "inline-flex items-center justify-center rounded-lg bg-[#0D6E4F] px-4 py-2 font-sans text-[14px] font-semibold text-white transition-colors hover:bg-[#12956A]"
                    }
                  >
                    Acessar
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
