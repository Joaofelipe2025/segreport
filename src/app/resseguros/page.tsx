import type { Metadata } from "next";
import { CategoryKey, getCategoryMeta } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Resseguros | Segreport",
  description:
    "Mercado de resseguro no Brasil: prêmios cedidos e aceitos, taxa de retenção, sinistralidade e ranking de resseguradoras.",
};

const CATEGORY_KEY: CategoryKey = "resseguros";

interface Kpi {
  label: string;
  value: string;
  delta: string;
  sentiment: "positivo" | "negativo" | "neutro";
}

const KPIS: Kpi[] = [
  {
    label: "Prêmios cedidos",
    value: "R$ 18,6 bi",
    delta: "+9% a.a.",
    sentiment: "positivo",
  },
  {
    label: "Prêmios aceitos (local)",
    value: "R$ 11,2 bi",
    delta: "+7,4% a.a.",
    sentiment: "positivo",
  },
  {
    label: "Taxa de retenção do mercado",
    value: "62%",
    delta: "+1,8pp",
    sentiment: "positivo",
  },
  {
    label: "Sinistralidade de resseguro",
    value: "68%",
    delta: "+4,1pp · eventos climáticos",
    sentiment: "neutro",
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
    title: "IRB Brasil anuncia novo aporte de R$180 milhões em capital",
    time: "Há 6h",
    dateTime: "2026-06-16T04:30:00-03:00",
    readTime: "4 min",
  },
  {
    title: "Mercado de resseguro brasileiro deve crescer 9% em 2026, projeta consultoria",
    time: "Há 22h",
    dateTime: "2026-06-15T12:30:00-03:00",
    readTime: "4 min",
  },
  {
    title: "Munich Re amplia capacidade de resseguro agrícola para o Centro-Oeste",
    time: "Há 1 dia",
    dateTime: "2026-06-15T10:30:00-03:00",
    readTime: "3 min",
  },
  {
    title: "SUSEP revisa regras de cessão de risco para resseguradoras eventuais",
    time: "Há 1 dia",
    dateTime: "2026-06-15T07:30:00-03:00",
    readTime: "5 min",
  },
  {
    title: "Swiss Re eleva estimativa de prêmios globais de resseguro de propriedade",
    time: "Há 2 dias",
    dateTime: "2026-06-14T15:30:00-03:00",
    readTime: "3 min",
  },
  {
    title: "Terra Brasis Re fecha parceria de retrocessão com sindicatos de Lloyd's",
    time: "Há 2 dias",
    dateTime: "2026-06-14T09:30:00-03:00",
    readTime: "4 min",
  },
];

interface SusepIndicator {
  label: string;
  value: string;
}

const SUSEP_INDICATORS: SusepIndicator[] = [
  { label: "Resseguradoras locais", value: "8" },
  { label: "Resseguradoras admitidas", value: "37" },
  { label: "Resseguradoras eventuais", value: "112" },
  { label: "Índice de cessão ao exterior", value: "38%" },
  { label: "Capital mínimo médio exigido", value: "R$ 60 mi" },
];

interface RankingItem {
  position: number;
  name: string;
  value: string;
  share: number;
}

const RANKING: RankingItem[] = [
  { position: 1, name: "IRB Brasil Re", value: "R$ 4,8 bi", share: 100 },
  { position: 2, name: "Munich Re", value: "R$ 3,9 bi", share: 81 },
  { position: 3, name: "Swiss Re", value: "R$ 3,2 bi", share: 67 },
  { position: 4, name: "Hannover Re", value: "R$ 2,6 bi", share: 54 },
  { position: 5, name: "Mapfre Re", value: "R$ 1,7 bi", share: 35 },
  { position: 6, name: "Austral Re", value: "R$ 980 mi", share: 20 },
  { position: 7, name: "Terra Brasis Re", value: "R$ 720 mi", share: 15 },
  { position: 8, name: "AXA XL Re", value: "R$ 540 mi", share: 11 },
];

export default function RessegurosPage() {
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
          Mercado de <span style={{ color: categoryMeta.color }}>Resseguros</span>
        </h1>
        <p className="mt-3 font-sans text-base font-light leading-relaxed text-[#3D3D3A]">
          Prêmios cedidos e aceitos, retenção de risco no mercado local e o ranking das principais
          resseguradoras que atuam no Brasil.
        </p>
      </header>

      <section aria-label="Indicadores do segmento de resseguros" className="mb-12">
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

      <section aria-labelledby="ranking-titulo" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2
            id="ranking-titulo"
            className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]"
          >
            Ranking de resseguradoras
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <p className="mb-5 font-sans text-[13px] leading-relaxed text-[#3D3D3A]">
          Top resseguradoras atuantes no Brasil por volume de prêmios de resseguro cedidos.
        </p>
        <ol className="flex flex-col gap-4 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5 md:p-6">
          {RANKING.map((item) => (
            <li key={item.name} className="flex items-center gap-4">
              <span className="w-6 shrink-0 font-mono text-[13px] font-medium text-[#76766f]">
                {item.position}º
              </span>
              <div className="flex-1">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="font-sans text-[14px] font-semibold text-[#1A1A18]">
                    {item.name}
                  </span>
                  <span className="font-mono text-[13px] font-medium text-[#1A1A18]">
                    {item.value}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,.06)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.share}%`,
                      backgroundColor: categoryMeta.color,
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Notícias do segmento de resseguros" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
            Notícias de resseguros
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

      <section aria-label="Dados SUSEP do ramo de resseguros">
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
