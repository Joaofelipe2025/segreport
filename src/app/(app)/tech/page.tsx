import type { Metadata } from "next";
import { CategoryKey, getCategoryMeta } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Tech & Insurtechs | Segreport",
  description:
    "Notícias sobre IA generativa em seguros, automação de sinistros, parcerias entre insurtechs e seguradoras tradicionais, e ranking de captação das insurtechs brasileiras.",
};

const SEGMENT_CATEGORY: CategoryKey = "tech";
const ACCENT = "#1A6FB0";

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
    title: "IA generativa já responde por 30% dos atendimentos em seguradoras",
    time: "Há 10h",
    dateTime: "2026-06-16T00:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Justos amplia uso de visão computacional para análise de sinistros de auto",
    time: "Há 1 dia",
    dateTime: "2026-06-15T13:10:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Pier fecha parceria com seguradora tradicional para distribuir seguro residencial",
    time: "Há 1 dia",
    dateTime: "2026-06-15T09:45:00-03:00",
    readTime: "4 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Azos capta nova rodada Série C para expandir seguro de vida digital",
    time: "Há 2 dias",
    dateTime: "2026-06-14T16:20:00-03:00",
    readTime: "5 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Automação de sinistros reduz tempo médio de pagamento para 48 horas",
    time: "Há 2 dias",
    dateTime: "2026-06-14T11:05:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Kakau integra chatbot com IA generativa para cotação instantânea de seguro auto",
    time: "Há 3 dias",
    dateTime: "2026-06-13T08:50:00-03:00",
    readTime: "3 min",
  },
  {
    category: SEGMENT_CATEGORY,
    title: "Toggle e Wiz Co. anunciam integração para distribuição white-label de seguros",
    time: "Há 3 dias",
    dateTime: "2026-06-13T07:15:00-03:00",
    readTime: "4 min",
  },
];

interface InsurtechRanking {
  posicao: number;
  nome: string;
  captacaoMilhoes: number;
}

const RANKING: InsurtechRanking[] = [
  { posicao: 1, nome: "Justos", captacaoMilhoes: 420 },
  { posicao: 2, nome: "Azos", captacaoMilhoes: 365 },
  { posicao: 3, nome: "Pier", captacaoMilhoes: 290 },
  { posicao: 4, nome: "Loovi", captacaoMilhoes: 210 },
  { posicao: 5, nome: "Kakau", captacaoMilhoes: 175 },
  { posicao: 6, nome: "Quick", captacaoMilhoes: 140 },
  { posicao: 7, nome: "MetLife Next", captacaoMilhoes: 98 },
  { posicao: 8, nome: "Toggle", captacaoMilhoes: 62 },
];

export default function TechPage() {
  const meta = getCategoryMeta(SEGMENT_CATEGORY);
  const maxCaptacao = RANKING[0].captacaoMilhoes;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-6">
      <header className="mb-10 max-w-[760px]">
        <span
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide"
          style={{ borderColor: `${ACCENT}33`, color: ACCENT, backgroundColor: `${ACCENT}0D` }}
        >
          <span aria-hidden="true">{meta.emoji}</span>
          {meta.label}
        </span>
        <h1
          className="border-b-4 pb-3 font-sans text-[32px] font-extrabold leading-tight text-[#1A1A18] md:text-[44px]"
          style={{ borderColor: ACCENT }}
        >
          Tech &amp; Insurtechs
        </h1>
        <p className="mt-3 font-sans text-base font-light leading-relaxed text-[#3D3D3A]">
          IA generativa, automação de sinistros e o avanço das insurtechs
          brasileiras em parceria com as seguradoras tradicionais.
        </p>
      </header>

      <section aria-label="Notícias de tecnologia e insurtechs" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
            Notícias de Tech
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

      <section aria-label="Ranking de insurtechs por captação">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-sans text-xl font-bold text-[#1A1A18]">
            Ranking de insurtechs por captação
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <ol className="flex flex-col gap-3 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5">
          {RANKING.map((item) => (
            <li key={item.nome} className="flex items-center gap-4">
              <span className="w-6 shrink-0 font-mono text-[13px] text-[#A8A8A3]">
                {item.posicao}
              </span>
              <span className="w-32 shrink-0 truncate font-sans text-[14px] font-semibold text-[#1A1A18] md:w-40">
                {item.nome}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#1A1A18]/10">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(item.captacaoMilhoes / maxCaptacao) * 100}%`,
                    backgroundColor: ACCENT,
                  }}
                />
              </span>
              <span className="w-24 shrink-0 text-right font-mono text-[13px] text-[#76766F]">
                R${item.captacaoMilhoes}M
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-mono text-[10px] text-[#A8A8A3]">
          Captação acumulada · dados plausíveis de demonstração
        </p>
      </section>
    </main>
  );
}
