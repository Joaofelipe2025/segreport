interface RankingItem {
  name: string;
  valueBi: number;
}

const RANKING: RankingItem[] = [
  { name: "BB Seguros", valueBi: 48.2 },
  { name: "Porto Seguro", valueBi: 38.6 },
  { name: "Bradesco", valueBi: 34.7 },
  { name: "SulAmérica", valueBi: 26.5 },
  { name: "Allianz", valueBi: 21.1 },
];

export default function RankingWidget() {
  const max = RANKING[0].valueBi;

  return (
    <section
      aria-label="Ranking de seguradoras"
      style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20 }}
    >
      <h2
        style={{
          paddingBottom: 12,
          fontFamily: "'Poppins', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        Top 5 seguradoras
      </h2>
      <ol style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
        {RANKING.map((item, index) => (
          <li
            key={item.name}
            style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'DM Mono', monospace", fontSize: 11 }}
          >
            <span style={{ width: 14, color: "var(--ink-4)" }}>{index + 1}</span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink)" }}>
              {item.name}
            </span>
            <span
              style={{
                width: 64,
                height: 6,
                borderRadius: 999,
                background: "rgba(0,0,0,.08)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${(item.valueBi / max) * 100}%`,
                  borderRadius: 999,
                  background: "var(--green)",
                }}
              />
            </span>
            <span style={{ width: 60, textAlign: "right", color: "var(--ink-3)" }}>
              R${item.valueBi.toFixed(1).replace(".", ",")}B
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
