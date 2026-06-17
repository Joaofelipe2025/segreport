import { Metadata } from "next";
import { CategoryKey, getCategoryMeta } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Seguro Auto | Segreport",
  description:
    "Indicadores, notícias e dados SUSEP do segmento de seguro auto no mercado segurador brasileiro.",
};

const SEGMENT_CATEGORY: CategoryKey = "auto";
const ACCENT = "#0D6E4F";

interface Kpi {
  label: string;
  value: string;
  delta: string;
  sentiment: "positivo" | "negativo" | "neutro";
}

const KPIS: Kpi[] = [
  {
    label: "Sinistralidade Auto",
    value: "64,2%",
    delta: "+1,1pp vs. trim. anterior",
    sentiment: "negativo",
  },
  {
    label: "Prêmios Auto",
    value: "R$ 98,4 bi",
    delta: "+5,2% no acumulado do ano",
    sentiment: "positivo",
  },
  {
    label: "Crescimento Anual",
    value: "+6,8% a.a.",
    delta: "Acima da média do mercado",
    sentiment: "positivo",
  },
  {
    label: "Ticket Médio",
    value: "R$ 2.340",
    delta: "+3,4% vs. ano anterior",
    sentiment: "neutro",
  },
];

interface NewsItem {
  category: CategoryKey;
  title: string;
  time: string;
  dateTime: string;
  readTime: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    category: SEGMENT_CATEGORY,
    title: "Sinistralidade de seguro auto sobe 2,3pp no primeiro trimestre",
    time: "Há 5h",
    dateTime: "2026-06-16T05:30:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Telemetria reduz sinistros em 15% entre seguradoras pioneiras",
    time: "Há 8h",
    dateTime: "2026-06-16T02:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Porto Seguro lança apólice flexível com pagamento por quilometragem",
    time: "Há 1 dia",
    dateTime: "2026-06-15T11:00:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Furtos de veículos elétricos pressionam tabela de risco das seguradoras",
    time: "Há 1 dia",
    dateTime: "2026-06-15T08:15:00-03:00",
    readTime: "5 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Bradesco Seguros amplia rede de oficinas referenciadas em 12 estados",
    time: "Há 2 dias",
    dateTime: "2026-06-14T14:40:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Mapfre testa precificação dinâmica baseada em dados de sinistro em tempo real",
    time: "Há 2 dias",
    dateTime: "2026-06-14T09:20:00-03:00",
    readTime: "4 min",
  },
];

interface SusepIndicator {
  label: string;
  value: string;
}

const SUSEP_INDICATORS: SusepIndicator[] = [
  { label: "Prêmio direto (ramo auto)", value: "R$ 98,4 bi" },
  { label: "Sinistro retido", value: "R$ 63,2 bi" },
  { label: "Índice de sinistralidade", value: "64,2%" },
  { label: "Índice de despesas administrativas", value: "11,7%" },
  { label: "Seguradoras atuantes no ramo", value: "47" },
];

function sentimentColor(sentiment: Kpi["sentiment"]): string {
  if (sentiment === "positivo") return "#12956A";
  if (sentiment === "negativo") return "#B83232";
  return "#B87214";
}

export default function AutoPage() {
  const meta = getCategoryMeta(SEGMENT_CATEGORY);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section aria-label="Visão geral do segmento Auto" className="mb-10">
        <span
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide"
          style={{ borderColor: `${ACCENT}33`, color: ACCENT, backgroundColor: `${ACCENT}0D` }}
        >
          <span aria-hidden="true">{meta.emoji}</span>
          {meta.label}
        </span>
        <h1
          className="border-b-4 pb-3 font-sans text-[32px] font-extrabold leading-[44px] text-[#1A1A18]"
          style={{ borderColor: ACCENT }}
        >
          Segmento Auto
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-[15px] text-[#3D3D3A]">
          Acompanhe sinistralidade, prêmios e as principais movimentações do
          mercado de seguros de automóveis no Brasil.
        </p>
      </section>

      <section aria-label="Indicadores do segmento Auto" className="mb-12">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-[rgba(0,0,0,.08)] md:grid-cols-2">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="flex flex-col gap-2 bg-white p-5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766f]">
                {kpi.label}
              </span>
              <span className="font-sans text-[32px] font-extrabold leading-tight text-[#1A1A18] md:text-[36px]">
                {kpi.value}
              </span>
              <span
                className="font-mono text-[12px] font-medium"
                style={{ color: sentimentColor(kpi.sentiment) }}
              >
                {kpi.delta}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Notícias de Auto" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
            Notícias de Auto
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>

        <ul role="feed" aria-busy="false" className="flex flex-col">
          {NEWS_ITEMS.map((item, index) => {
            const itemMeta = getCategoryMeta(item.category);
            return (
              <li
                key={item.title}
                role="article"
                aria-posinset={index + 1}
                aria-setsize={NEWS_ITEMS.length}
                className="border-b border-[rgba(0,0,0,.08)] py-5 first:pt-0 last:border-b-0"
              >
                <a href="#" className="group flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <span
                      className="font-mono text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: itemMeta.color }}
                    >
                      {itemMeta.label}
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
                    style={{ backgroundColor: `${itemMeta.color}1A` }}
                    aria-hidden="true"
                  >
                    {itemMeta.emoji}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Dados SUSEP do ramo Auto">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
            Dados SUSEP do ramo
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>

        <div className="overflow-hidden rounded-lg border border-[rgba(0,0,0,.08)] bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,.08)]">
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766f]">
                  Indicador
                </th>
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766f]">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {SUSEP_INDICATORS.map((indicator) => (
                <tr
                  key={indicator.label}
                  className="border-b border-[rgba(0,0,0,.06)] last:border-b-0"
                >
                  <td className="px-4 py-3 font-sans text-[14px] text-[#3D3D3A]">
                    {indicator.label}
                  </td>
                  <td className="px-4 py-3 font-mono text-[14px] font-semibold text-[#1A1A18]">
                    {indicator.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
