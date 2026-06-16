import { Metadata } from "next";
import { CategoryKey, getCategoryMeta } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Seguro Vida | Segreport",
  description:
    "Indicadores, notícias e dados SUSEP do segmento de seguro de vida no mercado segurador brasileiro.",
};

const SEGMENT_CATEGORY: CategoryKey = "vida";
const ACCENT = "#12956A";

interface Kpi {
  label: string;
  value: string;
  delta: string;
  sentiment: "positivo" | "negativo" | "neutro";
}

const KPIS: Kpi[] = [
  {
    label: "Crescimento do Segmento",
    value: "+18,0%",
    delta: "Maior crescimento entre os ramos",
    sentiment: "positivo",
  },
  {
    label: "Ticket Médio Mensal",
    value: "R$ 87",
    delta: "+9,1% vs. ano anterior",
    sentiment: "positivo",
  },
  {
    label: "Penetração da PEA",
    value: "34,0%",
    delta: "+2,4pp no acumulado do ano",
    sentiment: "positivo",
  },
  {
    label: "Prêmios Totais Vida",
    value: "R$ 142,7 bi",
    delta: "+11,3% no acumulado do ano",
    sentiment: "positivo",
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
    title: "Seguradoras de vida ampliam oferta de produtos para autônomos",
    time: "Há 8h",
    dateTime: "2026-06-16T02:30:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "SulAmérica registra alta de 21% em vendas de seguro vida individual",
    time: "Há 10h",
    dateTime: "2026-06-16T00:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "BB Seguros lança apólice de vida com cobertura para doenças graves",
    time: "Há 1 dia",
    dateTime: "2026-06-15T13:10:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Zurich aposta em subscrição simplificada para acelerar contratação digital",
    time: "Há 1 dia",
    dateTime: "2026-06-15T09:45:00-03:00",
    readTime: "4 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Caixa Seguradora amplia parceria com correspondentes bancários para vida em grupo",
    time: "Há 2 dias",
    dateTime: "2026-06-14T15:00:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Allianz vê demanda por seguro de vida crescer entre geração 50+",
    time: "Há 2 dias",
    dateTime: "2026-06-14T10:30:00-03:00",
    readTime: "5 min",
  },
];

interface SusepIndicator {
  label: string;
  value: string;
}

const SUSEP_INDICATORS: SusepIndicator[] = [
  { label: "Prêmio direto (ramo vida)", value: "R$ 142,7 bi" },
  { label: "Sinistro retido", value: "R$ 58,9 bi" },
  { label: "Índice de sinistralidade", value: "41,3%" },
  { label: "Índice de despesas administrativas", value: "9,8%" },
  { label: "Seguradoras atuantes no ramo", value: "63" },
];

function sentimentColor(sentiment: Kpi["sentiment"]): string {
  if (sentiment === "positivo") return "#12956A";
  if (sentiment === "negativo") return "#B83232";
  return "#B87214";
}

export default function VidaPage() {
  const meta = getCategoryMeta(SEGMENT_CATEGORY);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section aria-label="Visão geral do segmento Vida" className="mb-10">
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
          Segmento Vida
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-[15px] text-[#3D3D3A]">
          Crescimento acelerado, novos produtos e a expansão da proteção
          financeira no mercado brasileiro de seguros de vida.
        </p>
      </section>

      <section aria-label="Indicadores do segmento Vida" className="mb-12">
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

      <section aria-label="Notícias de Vida" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
            Notícias de Vida
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

      <section aria-label="Dados SUSEP do ramo Vida">
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
