"use client";

import { useEffect, useState } from "react";

interface ThermoItem {
  label: string;
  score: number;
}

const ITEMS: ThermoItem[] = [
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

export default function ThermoWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section
      aria-label="Termômetro do mercado"
      style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
          Termômetro do mercado
        </h2>
        <a
          href="/mercado"
          style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--green)" }}
        >
          Ver tudo →
        </a>
      </div>

      <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
        {ITEMS.map((item) => {
          const color = scoreColor(item.score);
          const pct = Math.min(100, Math.abs(item.score));
          return (
            <li key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 72,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--ink-3)",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background: "rgba(0,0,0,.08)",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: 999,
                    background: color,
                    transform: mounted ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.7s cubic-bezier(.4,0,.2,1)",
                  }}
                />
              </span>
              <span
                style={{
                  width: 32,
                  textAlign: "right",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
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

      <p style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-4)" }}>
        IA · 72h de notícias · −100 a +100
      </p>
    </section>
  );
}
