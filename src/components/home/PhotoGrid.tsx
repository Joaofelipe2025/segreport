import { CategoryKey, getCategoryMeta } from "@/lib/categories";

interface PhotoGridItem {
  category: CategoryKey;
  title: string;
  deck: string;
  time: string;
  dateTime: string;
  readTime: string;
}

const ITEMS: PhotoGridItem[] = [
  {
    category: "tech",
    title: "Insurtechs brasileiras captam R$340M em rodadas no primeiro semestre",
    deck: "Aportes concentrados em soluções de subscrição automatizada e IA para sinistros.",
    time: "Há 1h",
    dateTime: "2026-06-16T09:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: "agro",
    title: "Seguro rural cresce 22% e bate recorde de contratações no semestre",
    deck: "Linhas paramétricas ganham espaço entre produtores do Centro-Oeste.",
    time: "Há 3h",
    dateTime: "2026-06-16T07:30:00-03:00",
    readTime: "3 min",
  },
  {
    category: "saude",
    title: "ANS e SUSEP discutem integração de dados entre planos e seguros",
    deck: "Proposta busca reduzir duplicidade de informações e fraude em sinistros.",
    time: "Há 5h",
    dateTime: "2026-06-16T05:30:00-03:00",
    readTime: "5 min",
  },
];

export default function PhotoGrid() {
  return (
    <section aria-label="Notícias em destaque" className="border-b border-[rgba(0,0,0,.08)] py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-0">
        {ITEMS.map((item) => {
          const meta = getCategoryMeta(item.category);
          return (
            <a
              key={item.title}
              href="#"
              className="group flex flex-col gap-3 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-4 transition-colors hover:border-[#0D6E4F] md:rounded-none md:border-0 md:border-r md:border-[rgba(0,0,0,.06)] md:bg-transparent md:p-0 md:pl-6 md:pr-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <span
                className="flex h-[180px] items-center justify-center rounded-xl text-5xl"
                style={{ backgroundColor: `${meta.color}1f` }}
                aria-hidden="true"
              >
                {meta.emoji}
              </span>
              <span
                className="font-mono text-[10px] font-medium uppercase tracking-wide"
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
              <h3 className="font-sans text-[16px] font-bold leading-snug text-[#1A1A18] transition-colors group-hover:text-[#0D6E4F]">
                {item.title}
              </h3>
              <p className="font-sans text-[13px] text-[#3D3D3A]">{item.deck}</p>
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#76766f]">
                <time dateTime={item.dateTime}>{item.time}</time>
                <span aria-hidden="true">·</span>
                <span>{item.readTime}</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
