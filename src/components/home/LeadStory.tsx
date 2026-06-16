import Link from "next/link";

export default function LeadStory() {
  return (
    <article aria-label="Matéria principal">
      {/* Imagem placeholder */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: 10,
          background: "linear-gradient(135deg, var(--green-bg) 0%, var(--green) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 48,
            fontWeight: 800,
            color: "rgba(255,255,255,.15)",
            letterSpacing: "-2px",
          }}
        >
          SUSEP
        </span>
        <span
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: "rgba(255,255,255,.6)",
            background: "rgba(0,0,0,.3)",
            padding: "3px 8px",
            borderRadius: 4,
          }}
        >
          Regulação
        </span>
      </div>

      {/* Badge */}
      <span
        style={{
          display: "inline-block",
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--green)",
          background: "var(--green-bg)",
          padding: "3px 10px",
          borderRadius: 4,
          marginBottom: 12,
        }}
      >
        Regulação
      </span>

      <Link
        href="/noticias/regulacao-susep-2026"
        className="group block mb-3"
      >
        <h1
          className="group-hover:!text-[var(--green)] transition-colors"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "clamp(22px, 3.5vw, 32px)",
            fontWeight: 700,
            lineHeight: 1.25,
            color: "var(--ink)",
          }}
        >
          SUSEP publica novo marco regulatório para seguros de danos e amplia limites de cobertura obrigatória
        </h1>
      </Link>

      <p
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--ink-3)",
          marginBottom: 16,
        }}
      >
        A autarquia federal publicou nesta segunda-feira a Circular 723/2026, que redefine os critérios mínimos
        de cobertura para seguros de responsabilidade civil e amplia o escopo de proteção para pequenas e
        médias empresas. A medida entra em vigor em 90 dias.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-4)" }}>
          Redação Segreport
        </span>
        <span style={{ color: "var(--border)", fontSize: 16 }}>·</span>
        <time
          dateTime="2026-06-16T10:00:00-03:00"
          style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-4)" }}
        >
          Há 30 min
        </time>
        <span style={{ color: "var(--border)", fontSize: 16 }}>·</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-4)" }}>
          4 min de leitura
        </span>
      </div>
    </article>
  );
}
