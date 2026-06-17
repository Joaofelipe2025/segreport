import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre o Segreport — Inteligência do Mercado Segurador",
  description: "Conheça o Segreport, o portal de notícias, dados e inteligência dedicado ao mercado segurador brasileiro.",
};

export default function SobrePage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px 100px" }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green)", display: "block", marginBottom: 10 }}>
          Sobre nós
        </span>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.15, marginBottom: 16 }}>
          Inteligência para o mercado segurador brasileiro
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, color: "var(--ink-3)", lineHeight: 1.6 }}>
          O Segreport é o principal portal de notícias, dados e ferramentas para corretores de seguros, atuários, executivos e profissionais do mercado segurador do Brasil.
        </p>
      </div>

      {/* Missão */}
      <section style={{ marginBottom: 48, padding: "32px", background: "var(--green-bg)", borderRadius: 12, borderLeft: "4px solid var(--green)" }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--green)", marginBottom: 10 }}>Nossa missão</h2>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, color: "var(--ink-2)", lineHeight: 1.7 }}>
          Democratizar o acesso à informação qualificada sobre o setor de seguros, resseguros e previdência, oferecendo jornalismo especializado, dados regulatórios em tempo real e ferramentas práticas para a tomada de decisão.
        </p>
      </section>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, marginBottom: 48 }}>
        {[
          { icon: "📰", title: "Jornalismo especializado", desc: "Cobertura diária das regulações da SUSEP, CNSP e do mercado livre." },
          { icon: "📊", title: "Dados e estatísticas", desc: "Indicadores do BCB, SUSEP, IBGE e fontes setoriais em tempo real." },
          { icon: "🛠️", title: "Ferramentas práticas", desc: "Calculadoras, simuladores e dashboards para corretores e atuários." },
          { icon: "🤖", title: "IA editorial", desc: "Análises automatizadas e resumos gerados por inteligência artificial." },
        ].map((item) => (
          <div key={item.title} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{item.icon}</span>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{item.title}</h3>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.55 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Contato CTA */}
      <div style={{ background: "var(--ink)", borderRadius: 12, padding: "32px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Quer falar com a redação?</h2>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "rgba(255,255,255,.6)" }}>Pautas, sugestões, parcerias e anúncios.</p>
        </div>
        <Link href="/contato" style={{ borderRadius: 999, background: "var(--green)", padding: "10px 24px", fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>
          Fale conosco →
        </Link>
      </div>
    </div>
  );
}
