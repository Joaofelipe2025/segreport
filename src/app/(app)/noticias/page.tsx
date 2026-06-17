import type { Metadata } from "next";
import { CategoryKey, getCategoryMeta } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Todas as notícias | Segreport",
  description:
    "Cobertura completa do mercado segurador brasileiro: auto, vida, saúde, agro, resseguros, regulação e tecnologia.",
};

interface NewsItem {
  category: CategoryKey;
  title: string;
  deck: string;
  time: string;
  dateTime: string;
  readTime: string;
}

const ITEMS: NewsItem[] = [
  {
    category: "regulacao",
    title: "CNSP aprova novas regras de governança para seguradoras de médio porte",
    deck: "Resolução define prazos de adequação e novos requisitos de controles internos a partir de 2027.",
    time: "Há 3h",
    dateTime: "2026-06-16T07:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: "auto",
    title: "Sinistralidade de seguro auto sobe 2,3pp no primeiro trimestre",
    deck: "Alta de furtos e roubos em capitais pressiona margens das seguradoras líderes do segmento.",
    time: "Há 5h",
    dateTime: "2026-06-16T05:30:00-03:00",
    readTime: "3 min",
  },
  {
    category: "resseguros",
    title: "IRB Brasil anuncia novo aporte de R$180 milhões em capital",
    deck: "Movimento busca reforçar índice de solvência após resultado do quarto trimestre.",
    time: "Há 6h",
    dateTime: "2026-06-16T04:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: "vida",
    title: "Seguradoras de vida ampliam oferta de produtos para autônomos",
    deck: "Novos planos miram trabalhadores de plataforma e microempreendedores individuais.",
    time: "Há 8h",
    dateTime: "2026-06-16T02:30:00-03:00",
    readTime: "3 min",
  },
  {
    category: "saude",
    title: "ANS e SUSEP discutem integração de dados entre planos e seguros",
    deck: "Reguladores avaliam compartilhamento de informações para combater fraudes no setor.",
    time: "Há 10h",
    dateTime: "2026-06-16T00:30:00-03:00",
    readTime: "5 min",
  },
  {
    category: "agro",
    title: "Seguro rural cresce 22% e bate recorde de contratações no semestre",
    deck: "Produtores do Centro-Oeste impulsionam demanda diante de risco climático crescente.",
    time: "Há 12h",
    dateTime: "2026-06-15T22:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: "tech",
    title: "IA generativa já responde por 30% dos atendimentos em seguradoras",
    deck: "Chatbots e copilotos internos reduzem tempo médio de resposta em sinistros simples.",
    time: "Há 14h",
    dateTime: "2026-06-15T20:30:00-03:00",
    readTime: "3 min",
  },
  {
    category: "auto",
    title: "Telemetria reduz sinistros em 15% entre seguradoras pioneiras",
    deck: "Programas de monitoramento por aplicativo incentivam direção mais segura entre jovens.",
    time: "Há 16h",
    dateTime: "2026-06-15T18:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: "regulacao",
    title: "SUSEP abre consulta pública sobre novo marco de capital mínimo",
    deck: "Proposta revisa metodologia de cálculo de capital baseado em risco para seguradoras.",
    time: "Há 18h",
    dateTime: "2026-06-15T16:30:00-03:00",
    readTime: "5 min",
  },
  {
    category: "vida",
    title: "Bradesco Seguros lança produto de vida com cobertura para doenças graves",
    deck: "Apólice inclui assistência psicológica e antecipação de capital em caso de diagnóstico.",
    time: "Há 20h",
    dateTime: "2026-06-15T14:30:00-03:00",
    readTime: "3 min",
  },
  {
    category: "resseguros",
    title: "Mercado de resseguro brasileiro deve crescer 9% em 2026, projeta consultoria",
    deck: "Eventos climáticos extremos elevam demanda por proteção de excedente de sinistro.",
    time: "Há 22h",
    dateTime: "2026-06-15T12:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: "saude",
    title: "Tokio Marine amplia rede credenciada de seguros saúde em capitais do Nordeste",
    deck: "Expansão soma mais de 400 novos prestadores conveniados nos próximos seis meses.",
    time: "Há 1 dia",
    dateTime: "2026-06-15T09:30:00-03:00",
    readTime: "3 min",
  },
];

export default function NoticiasPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-6">
      <header className="mb-10 max-w-[760px]">
        <h1 className="font-sans text-[32px] font-extrabold leading-tight text-[#1A1A18] md:text-[44px]">
          Notícias
        </h1>
        <p className="mt-3 font-sans text-base font-light leading-relaxed text-[#3D3D3A]">
          Cobertura completa do mercado segurador brasileiro — regulação, auto, vida, saúde, agro,
          resseguros e tecnologia, com análises e dados das principais seguradoras do país.
        </p>
      </header>

      <div
        role="feed"
        aria-busy="false"
        aria-label="Todas as notícias"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {ITEMS.map((item, index) => {
          const meta = getCategoryMeta(item.category);
          return (
            <article
              key={item.title}
              role="article"
              aria-posinset={index + 1}
              aria-setsize={ITEMS.length}
              className="flex flex-col"
            >
              <a href="#" className="group flex flex-col gap-3">
                <div
                  className="flex h-[160px] items-center justify-center rounded-xl text-5xl md:h-[180px]"
                  style={{ backgroundColor: `${meta.color}1A` }}
                  aria-hidden="true"
                >
                  {meta.emoji}
                </div>

                <span
                  className="font-mono text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </span>

                <h2 className="font-sans text-[16px] font-bold leading-snug text-[#1A1A18] transition-colors group-hover:text-[#0D6E4F]">
                  {item.title}
                </h2>

                <p className="font-sans text-[13px] leading-relaxed text-[#3D3D3A]">{item.deck}</p>

                <div className="flex items-center gap-2 font-mono text-[11px] text-[#76766f]">
                  <time dateTime={item.dateTime}>{item.time}</time>
                  <span aria-hidden="true">·</span>
                  <span>{item.readTime}</span>
                </div>
              </a>
            </article>
          );
        })}
      </div>

      <nav aria-label="Paginação" className="mt-12 flex items-center justify-center gap-2">
        <a
          href="#"
          className="rounded-full border border-[rgba(0,0,0,.08)] px-4 py-2 font-mono text-[12px] font-medium text-[#76766f] transition-colors hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
        >
          Anterior
        </a>
        <a
          href="#"
          aria-current="page"
          className="rounded-full bg-[#0D6E4F] px-4 py-2 font-mono text-[12px] font-medium text-white"
        >
          1
        </a>
        <a
          href="#"
          className="rounded-full border border-[rgba(0,0,0,.08)] px-4 py-2 font-mono text-[12px] font-medium text-[#76766f] transition-colors hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
        >
          2
        </a>
        <a
          href="#"
          className="rounded-full border border-[rgba(0,0,0,.08)] px-4 py-2 font-mono text-[12px] font-medium text-[#76766f] transition-colors hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
        >
          3
        </a>
        <a
          href="#"
          className="rounded-full border border-[rgba(0,0,0,.08)] px-4 py-2 font-mono text-[12px] font-medium text-[#76766f] transition-colors hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
        >
          Próxima
        </a>
      </nav>
    </main>
  );
}
