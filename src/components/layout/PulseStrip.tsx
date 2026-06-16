import Link from "next/link";

interface PulseItem {
  label: string;
  score: number;
}

const PULSE_ITEMS: PulseItem[] = [
  { label: "Auto", score: 78 },
  { label: "Vida", score: 65 },
  { label: "Saúde", score: 42 },
  { label: "Agro", score: 55 },
  { label: "Resseguros", score: -28 },
  { label: "Regulação", score: -18 },
];

function scoreColor(score: number): string {
  if (score > 15) return "var(--green-2)";
  if (score < -15) return "var(--red)";
  return "var(--amber)";
}

export default function PulseStrip() {
  return (
    <section
      aria-label="Termômetro de sentimento do mercado"
      className="hidden md:block"
      style={{
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 0",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}
      >
        <ul style={{ flex: 1, display: "flex", alignItems: "center", gap: 24, listStyle: "none" }}>
          {PULSE_ITEMS.map((item) => {
            const color = scoreColor(item.score);
            const pct = Math.min(100, Math.abs(item.score));
            return (
              <li key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--ink-4)",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    width: 44,
                    height: 4,
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
                      width: `${pct}%`,
                      borderRadius: 999,
                      background: color,
                    }}
                  />
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    color,
                  }}
                >
                  {item.score > 0 ? `+${item.score}` : item.score}
                </span>
              </li>
            );
          })}
        </ul>

        <Link
          href="/mercado"
          style={{
            flexShrink: 0,
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: "var(--green)",
          }}
        >
          Dashboard →
        </Link>
      </div>
    </section>
  );
}
