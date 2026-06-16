import { CategoryKey, getCategoryMeta } from "@/lib/categories";

interface LatestItem {
  category: CategoryKey;
  title: string;
  time: string;
  dateTime: string;
  readTime: string;
}

const ITEMS: LatestItem[] = [
  {
    category: "regulacao",
    title: "CNSP aprova novas regras de governança para seguradoras de médio porte",
    time: "Há 3h",
    dateTime: "2026-06-16T07:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: "auto",
    title: "Sinistralidade de seguro auto sobe 2,3pp no primeiro trimestre",
    time: "Há 5h",
    dateTime: "2026-06-16T05:30:00-03:00",
    readTime: "3 min",
  },
  {
    category: "resseguros",
    title: "IRB Brasil anuncia novo aporte de R$180 milhões em capital",
    time: "Há 6h",
    dateTime: "2026-06-16T04:30:00-03:00",
    readTime: "4 min",
  },
  {
    category: "vida",
    title: "Seguradoras de vida ampliam oferta de produtos para autônomos",
    time: "Há 8h",
    dateTime: "2026-06-16T02:30:00-03:00",
    readTime: "3 min",
  },
];

export default function LatestList() {
  return (
    <section aria-label="Últimas notícias" className="py-8">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
          Últimas notícias
        </h2>
        <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
      </div>

      <ul role="feed" aria-busy="false" className="flex flex-col">
        {ITEMS.map((item, index) => {
          const meta = getCategoryMeta(item.category);
          return (
            <li
              key={item.title}
              role="article"
              aria-posinset={index + 1}
              aria-setsize={ITEMS.length}
              className="border-b border-[rgba(0,0,0,.08)] py-5 first:pt-0 last:border-b-0"
            >
              <a href="#" className="group flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span
                    className="font-mono text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
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
                  style={{ backgroundColor: `${meta.color}1A` }}
                  aria-hidden="true"
                >
                  {meta.emoji}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
