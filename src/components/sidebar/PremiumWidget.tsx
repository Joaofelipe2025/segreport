import Link from "next/link";

const FEATURES = [
  "Dashboard completo de indicadores",
  "Alertas de circulares em tempo real",
  "Relatórios setoriais exclusivos",
  "Acesso antecipado a análises",
];

export default function PremiumWidget() {
  return (
    <section
      aria-label="Assinatura Premium"
      style={{
        borderRadius: 16,
        border: "1.5px solid var(--green-bg)",
        padding: 20,
      }}
    >
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--green)",
        }}
      >
        Segreport Premium
      </p>
      <h2
        style={{
          marginTop: 8,
          fontFamily: "'Poppins', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          color: "var(--ink)",
          lineHeight: 1.2,
        }}
      >
        Acesso completo ao mercado
      </h2>

      <ul style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, listStyle: "none" }}>
        {FEATURES.map((feature) => (
          <li
            key={feature}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontFamily: "'Poppins', sans-serif",
              fontSize: 13,
              color: "var(--ink-2)",
            }}
          >
            <span style={{ color: "var(--green)", marginTop: 1 }} aria-hidden="true">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <p
        style={{
          marginTop: 20,
          fontFamily: "'Poppins', sans-serif",
          fontSize: 32,
          fontWeight: 800,
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        R$97
        <span style={{ fontSize: 14, fontWeight: 400, color: "var(--ink-3)" }}>/mês</span>
      </p>

      <Link
        href="/premium"
        className="hover:opacity-90 transition-opacity"
        style={{
          display: "block",
          marginTop: 16,
          textAlign: "center",
          borderRadius: 999,
          background: "var(--green)",
          padding: "10px 16px",
          fontFamily: "'Poppins', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
        }}
      >
        Começar 7 dias grátis
      </Link>
    </section>
  );
}
