import { CategoryKey, getCategoryMeta } from "@/lib/categories";

interface NewsGridItem {
  category: CategoryKey;
  title: string;
  time: string;
  dateTime: string;
}

const ITEMS: NewsGridItem[] = [
  {
    category: "agro",
    title: "Seguro rural cresce 22% e bate recorde de contratações no semestre",
    time: "Há 1h",
    dateTime: "2026-06-16T09:30:00-03:00",
  },
  {
    category: "vida",
    title: "Seguradoras de vida ampliam oferta de produtos para autônomos",
    time: "Há 2h",
    dateTime: "2026-06-16T08:30:00-03:00",
  },
  {
    category: "saude",
    title: "ANS e SUSEP discutem integração de dados entre planos e seguros",
    time: "Há 4h",
    dateTime: "2026-06-16T06:30:00-03:00",
  },
];

export default function NewsGrid() {
  return (
    <section aria-label="Destaques do dia">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 1,
          background: "var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {ITEMS.map((item) => {
          const meta = getCategoryMeta(item.category);
          return (
            <a
              key={item.title}
              href="#"
              className="group bg-[var(--white)] hover:bg-[var(--bg)] transition-colors"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 16,
              }}
            >
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
              <h3
                className="group-hover:text-[var(--green)] transition-colors"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: "var(--ink)",
                }}
              >
                {item.title}
              </h3>
              <time
                dateTime={item.dateTime}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-4)" }}
              >
                {item.time}
              </time>
            </a>
          );
        })}
      </div>
    </section>
  );
}
