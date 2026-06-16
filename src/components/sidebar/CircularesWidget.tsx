interface Circular {
  code: string;
  status: "new" | "read";
  date: string;
}

const CIRCULARES: Circular[] = [
  { code: "Circular SUSEP 723/2026", status: "new", date: "14 jun" },
  { code: "Circular SUSEP 722/2026", status: "new", date: "10 jun" },
  { code: "Circular SUSEP 721/2026", status: "read", date: "02 jun" },
];

export default function CircularesWidget() {
  return (
    <section
      aria-label="Circulares SUSEP"
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
        Circulares SUSEP
      </h2>
      <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
        {CIRCULARES.map((item) => (
          <li key={item.code} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span
              aria-hidden="true"
              style={{
                marginTop: 6,
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                background: item.status === "new" ? "var(--amber)" : "var(--ink-4)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--ink)" }}>
                {item.code}
              </span>
              <time style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-3)" }}>
                {item.date}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
