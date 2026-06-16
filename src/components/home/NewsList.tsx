import Link from "next/link";
import { CategoryKey, getCategoryMeta } from "@/lib/categories";

interface NewsItem {
  category: CategoryKey;
  title: string;
  time: string;
  dateTime: string;
  slug: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    category: "auto",
    title: "Telemetria reduz sinistros em 15% entre seguradoras que adotaram monitoramento comportamental",
    time: "Há 1h",
    dateTime: "2026-06-16T09:30:00-03:00",
    slug: "telemetria-reduz-sinistros-15",
  },
  {
    category: "resseguros",
    title: "IRB Brasil anuncia aporte de R$180 milhões e mira expansão no mercado latino-americano",
    time: "Há 2h",
    dateTime: "2026-06-16T08:30:00-03:00",
    slug: "irb-brasil-aporte-180-milhoes",
  },
  {
    category: "tech",
    title: "IA generativa já responde por 30% dos atendimentos em seguradoras líderes do Brasil",
    time: "Há 3h",
    dateTime: "2026-06-16T07:30:00-03:00",
    slug: "ia-generativa-30-atendimentos-seguradoras",
  },
];

export default function NewsList() {
  return (
    <ol
      role="feed"
      aria-label="Últimas notícias"
      style={{ display: "flex", flexDirection: "column", listStyle: "none" }}
    >
      {NEWS_ITEMS.map((item, index) => {
        const meta = getCategoryMeta(item.category);
        const isLast = index === NEWS_ITEMS.length - 1;
        return (
          <li
            key={item.slug}
            role="article"
            aria-posinset={index + 1}
            aria-setsize={NEWS_ITEMS.length}
            style={{
              padding: "16px 0",
              borderBottom: isLast ? "none" : "1px solid var(--border)",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 20,
                fontWeight: 500,
                color: "var(--border)",
                lineHeight: 1,
                flexShrink: 0,
                width: 24,
                paddingTop: 2,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: meta.color,
                }}
              >
                {meta.label}
              </span>
              <Link
                href={`/noticias/${item.slug}`}
                className="transition-colors hover:text-[var(--green)]"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: "var(--ink)",
                }}
              >
                {item.title}
              </Link>
              <time
                dateTime={item.dateTime}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-4)" }}
              >
                {item.time}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
