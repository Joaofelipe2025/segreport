import type { Metadata } from "next";
import CircularesFilter from "./CircularesFilter";

export const metadata: Metadata = {
  title: "Mercado | Segreport",
  description:
    "Dashboard do mercado segurador brasileiro: indicadores, termômetro de sentimento por segmento, ranking de seguradoras e circulares SUSEP.",
};

interface Kpi {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
}

const KPIS: Kpi[] = [
  { label: "Prêmios emitidos", value: "R$312B", delta: "+4,2% a.a.", trend: "up" },
  { label: "Sinistralidade", value: "58,3%", delta: "+1,1pp", trend: "up" },
  { label: "SELIC", value: "10,75%", delta: "-0,25pp", trend: "down" },
  { label: "IPCA (12m)", value: "4,83%", delta: "-0,12pp", trend: "down" },
];

interface ThermoItem {
  label: string;
  score: number;
}

const THERMO_ITEMS: ThermoItem[] = [
  { label: "Auto", score: 78 },
  { label: "Vida", score: 65 },
  { label: "Saúde", score: 42 },
  { label: "Agro", score: 55 },
  { label: "Resseguros", score: -28 },
  { label: "Regulação", score: -18 },
  { label: "Tech", score: 61 },
  { label: "Previdência", score: 33 },
  { label: "Capitalização", score: -8 },
  { label: "Transportes", score: -34 },
];

function scoreColor(score: number): string {
  if (score > 15) return "#12956A";
  if (score < -15) return "#B83232";
  return "#B87214";
}

interface RankingItem {
  posicao: number;
  nome: string;
  valorBi: number;
}

const RANKING: RankingItem[] = [
  { posicao: 1, nome: "BB Seguros", valorBi: 48.2 },
  { posicao: 2, nome: "Porto Seguro", valorBi: 38.6 },
  { posicao: 3, nome: "Bradesco Seguros", valorBi: 34.7 },
  { posicao: 4, nome: "SulAmérica", valorBi: 26.5 },
  { posicao: 5, nome: "Allianz", valorBi: 21.1 },
  { posicao: 6, nome: "Caixa Seguradora", valorBi: 18.4 },
  { posicao: 7, nome: "Tokio Marine", valorBi: 15.9 },
  { posicao: 8, nome: "Mapfre", valorBi: 13.2 },
  { posicao: 9, nome: "Zurich", valorBi: 10.7 },
  { posicao: 10, nome: "HDI Seguros", valorBi: 8.9 },
];

export default function MercadoPage() {
  const maxRanking = RANKING[0].valorBi;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-6">
      <header className="mb-10 max-w-[760px]">
        <h1 className="font-sans text-[32px] font-extrabold leading-tight text-[#1A1A18] md:text-[44px]">
          Mercado
        </h1>
        <p className="mt-3 font-sans text-base font-light leading-relaxed text-[#3D3D3A]">
          Indicadores, sentimento por segmento e ranking das principais seguradoras do
          mercado brasileiro, com circulares regulatórias recentes da SUSEP.
        </p>
        <time
          dateTime="2026-06-16T09:00:00-03:00"
          className="mt-3 block font-mono text-[12px] text-[#76766F]"
        >
          Última atualização: 16 jun 2026, 09:00
        </time>
      </header>

      <section aria-label="Indicadores do mercado" className="mb-12">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-[rgba(0,0,0,.08)] md:grid-cols-2">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="flex flex-col gap-2 bg-white p-5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
                {kpi.label}
              </span>
              <span className="font-sans text-[36px] font-extrabold leading-none text-[#1A1A18]">
                {kpi.value}
              </span>
              <span
                className="font-mono text-[12px] font-medium"
                style={{ color: kpi.trend === "up" ? "#12956A" : "#B83232" }}
              >
                {kpi.trend === "up" ? "↑" : "↓"} {kpi.delta}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Termômetro completo do mercado" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-sans text-xl font-bold text-[#1A1A18]">
            Termômetro do mercado
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <ul className="flex flex-col gap-4 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5">
          {THERMO_ITEMS.map((item) => {
            const color = scoreColor(item.score);
            const pct = Math.min(100, Math.abs(item.score));
            return (
              <li key={item.label} className="flex items-center gap-4">
                <span className="w-28 shrink-0 font-mono text-[11px] uppercase tracking-wide text-[#76766F]">
                  {item.label}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#1A1A18]/10">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </span>
                <span
                  className="w-10 shrink-0 text-right font-mono text-[13px] font-medium"
                  style={{ color }}
                >
                  {item.score > 0 ? `+${item.score}` : item.score}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 font-mono text-[10px] text-[#A8A8A3]">
          IA · 72h de notícias · −100 a +100
        </p>
      </section>

      <section aria-label="Ranking de seguradoras" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-sans text-xl font-bold text-[#1A1A18]">
            Top 10 seguradoras por prêmios emitidos
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <ol className="flex flex-col gap-3 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5">
          {RANKING.map((item) => (
            <li key={item.nome} className="flex items-center gap-4">
              <span className="w-6 shrink-0 font-mono text-[13px] text-[#A8A8A3]">
                {item.posicao}
              </span>
              <span className="w-40 shrink-0 truncate font-sans text-[14px] font-semibold text-[#1A1A18] md:w-48">
                {item.nome}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#1A1A18]/10">
                <span
                  className="block h-full rounded-full bg-[#0D6E4F]"
                  style={{ width: `${(item.valorBi / maxRanking) * 100}%` }}
                />
              </span>
              <span className="w-20 shrink-0 text-right font-mono text-[13px] text-[#76766F]">
                R${item.valorBi.toFixed(1).replace(".", ",")}B
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Circulares SUSEP recentes">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-sans text-xl font-bold text-[#1A1A18]">
            Circulares SUSEP recentes
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <CircularesFilter />
      </section>
    </main>
  );
}
