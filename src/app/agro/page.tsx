import type { Metadata } from "next";
import { CategoryKey, getCategoryMeta } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Agro | Segreport",
  description:
    "Seguro rural no Brasil: prêmios, sinistralidade, seguro paramétrico e dados SUSEP do ramo agro.",
};

const CATEGORY_KEY: CategoryKey = "agro";

interface Kpi {
  label: string;
  value: string;
  delta: string;
  sentiment: "positivo" | "negativo" | "neutro";
}

const KPIS: Kpi[] = [
  {
    label: "Prêmios agro (acumulado)",
    value: "R$ 22,4 bi",
    delta: "+22% a.a.",
    sentiment: "positivo",
  },
  {
    label: "Crescimento do ramo",
    value: "+22%",
    delta: "vs. ano anterior",
    sentiment: "positivo",
  },
  {
    label: "Sinistralidade agro",
    value: "71%",
    delta: "+6,8pp · eventos climáticos",
    sentiment: "neutro",
  },
  {
    label: "Área segurada",
    value: "38,2 mi ha",
    delta: "+14% em apólices",
    sentiment: "positivo",
  },
];

const SENTIMENT_COLOR: Record<Kpi["sentiment"], string> = {
  positivo: "#12956A",
  negativo: "#B83232",
  neutro: "#B87214",
};

interface NewsItem {
  title: string;
  time: string;
  dateTime: string;
  readTime: string;
}

const NEWS: NewsItem[] = [
  {
    title: "Seguro rural cresce 22% e bate recorde de contratações no semestre",
    time: "Há 1h",
    dateTime: "2026-06-16T09:30:00-03:00",
    readTime: "4 min",
  },
  {
    title: "Mato Grosso lidera contratação de seguro paramétrico para soja e milho",
    time: "Há 3h",
    dateTime: "2026-06-16T07:30:00-03:00",
    readTime: "3 min",
  },
  {
    title: "Frente fria atrasa colheita no Rio Grande do Sul e eleva sinistros em grãos",
    time: "Há 7h",
    dateTime: "2026-06-16T03:30:00-03:00",
    readTime: "4 min",
  },
  {
    title: "Programa de subvenção ao seguro rural recebe aporte adicional de R$1,2 bi",
    time: "Há 11h",
    dateTime: "2026-06-15T23:30:00-03:00",
    readTime: "5 min",
  },
  {
    title: "Seguradoras ampliam uso de imagens de satélite para precificar risco de safra",
    time: "Há 15h",
    dateTime: "2026-06-15T19:30:00-03:00",
    readTime: "3 min",
  },
  {
    title: "Paraná registra alta de 18% em apólices de seguro agrícola para a safra de inverno",
    time: "Há 1 dia",
    dateTime: "2026-06-15T09:30:00-03:00",
    readTime: "4 min",
  },
];

interface SusepIndicator {
  label: string;
  value: string;
}

const SUSEP_INDICATORS: SusepIndicator[] = [
  { label: "Apólices vigentes", value: "412 mil" },
  { label: "Indenizações pagas (12m)", value: "R$ 9,8 bi" },
  { label: "Ticket médio por apólice", value: "R$ 54,3 mil" },
  { label: "Participação no PSR", value: "61%" },
  { label: "Seguradoras ativas no ramo", value: "23" },
];

export default function AgroPage() {
  const categoryMeta = getCategoryMeta(CATEGORY_KEY);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-6">
      <header className="mb-10 max-w-[760px]">
        <span
          className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide"
          style={{ backgroundColor: `${categoryMeta.color}1A`, color: categoryMeta.color }}
        >
          <span aria-hidden="true">{categoryMeta.emoji}</span>
          {categoryMeta.label}
        </span>
        <h1 className="font-sans text-[32px] font-extrabold leading-tight text-[#1A1A18] md:text-[44px]">
          Seguro <span style={{ color: categoryMeta.color }}>Agro</span> no Brasil
        </h1>
        <p className="mt-3 font-sans text-base font-light leading-relaxed text-[#3D3D3A]">
          Prêmios, sinistralidade e cobertura de risco climático no seguro rural — do seguro
          paramétrico ao acompanhamento de safra nas principais regiões produtoras do país.
        </p>
      </header>

      <section aria-label="Indicadores do segmento agro" className="mb-12">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-[rgba(0,0,0,.08)] md:grid-cols-2">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="flex flex-col gap-2 bg-white p-5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766f]">
                {kpi.label}
              </span>
              <span className="font-sans text-[32px] font-extrabold leading-none text-[#1A1A18] md:text-[36px]">
                {kpi.value}
              </span>
              <span
                className="font-mono text-[12px] font-medium"
                style={{ color: SENTIMENT_COLOR[kpi.sentiment] }}
              >
                {kpi.delta}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="parametrico-titulo"
        className="mb-12 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-6 md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#7A8C1F]">
              Destaque do segmento
            </span>
            <h2 id="parametrico-titulo" className="mt-2 font-sans text-[22px] font-bold text-[#1A1A18] md:text-[26px]">
              Seguro paramétrico ganha espaço na safra
            </h2>
            <p className="mt-3 font-sans text-[14px] leading-relaxed text-[#3D3D3A]">
              No modelo paramétrico, a indenização é calculada automaticamente a partir de um
              índice climático ou de dados de satélite — como volume de chuva ou temperatura —,
              sem necessidade de vistoria no campo. Isso reduz o tempo de pagamento de meses para
              dias e amplia o acesso de pequenos e médios produtores à proteção contra perdas de
              safra.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 rounded-lg bg-[#7A8C1F0D] p-5 md:w-[280px]">
            <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766f]">
              Janela da safra atual
            </span>
            <p className="font-sans text-[13px] leading-relaxed text-[#3D3D3A]">
              Estimativa de safra de grãos 2025/2026 em 320 milhões de toneladas, com plantio
              concentrado entre setembro e dezembro.
            </p>
            <ul className="flex flex-col gap-1.5 font-mono text-[12px] text-[#3D3D3A]">
              <li>🌾 Mato Grosso — maior área segurada</li>
              <li>🌾 Paraná — alta em soja e milho</li>
              <li>🌾 Rio Grande do Sul — risco climático elevado</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="Notícias do segmento agro" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
            Notícias do agro
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <ul role="feed" aria-busy="false" className="flex flex-col">
          {NEWS.map((item, index) => (
            <li
              key={item.title}
              role="article"
              aria-posinset={index + 1}
              aria-setsize={NEWS.length}
              className="border-b border-[rgba(0,0,0,.08)] py-5 first:pt-0 last:border-b-0"
            >
              <a href="#" className="group flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span
                    className="font-mono text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: categoryMeta.color }}
                  >
                    {categoryMeta.label}
                  </span>
                  <h3 className="font-sans text-[15px] font-semibold leading-snug text-[#1A1A18] transition-colors group-hover:text-[#0D6E4F]">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#76766f]">
                    <time dateTime={item.dateTime}>{item.time}</time>
                    <span aria-hidden="true">·</span>
                    <span>{item.readTime}</span>
                  </div>
                </div>
                <span
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-3xl"
                  style={{ backgroundColor: `${categoryMeta.color}1A` }}
                  aria-hidden="true"
                >
                  {categoryMeta.emoji}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Dados SUSEP do ramo agro">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
            Dados SUSEP do ramo
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-[rgba(0,0,0,.08)] md:grid-cols-2 lg:grid-cols-5">
          {SUSEP_INDICATORS.map((indicator) => (
            <li key={indicator.label} className="flex flex-col gap-2 bg-white p-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-[#76766f]">
                {indicator.label}
              </span>
              <span className="font-mono text-[18px] font-medium text-[#1A1A18]">
                {indicator.value}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
