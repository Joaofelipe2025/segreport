import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Anuncie no Segreport — Alcance profissionais do mercado segurador",
  description: "Alcance corretores, atuários e executivos do mercado segurador brasileiro anunciando no Segreport.",
};

const FORMATOS = [
  { nome: "Banner Homepage", desc: "Posição premium no topo da homepage, visível para todos os visitantes.", alcance: "80k+ impressões/mês", cor: "var(--green)" },
  { nome: "Native Ad", desc: "Conteúdo patrocinado integrado ao feed de notícias, formato editorial.", alcance: "45k+ leituras/mês", cor: "var(--blue)" },
  { nome: "Newsletter Sponsor", desc: "Patrocínio exclusivo na newsletter semanal enviada às sextas-feiras.", alcance: "12k assinantes", cor: "var(--amber)" },
  { nome: "Relatório Setorial", desc: "Co-branding em relatórios exclusivos de dados e tendências do setor.", alcance: "Alta qualificação", cor: "#6B5B95" },
];

export default function AnunciePage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 100px" }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green)", display: "block", marginBottom: 10 }}>
        Mídia Kit
      </span>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: 12 }}>
        Alcance quem decide no mercado segurador
      </h1>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, color: "var(--ink-3)", marginBottom: 48, lineHeight: 1.6, maxWidth: 600 }}>
        O Segreport conecta sua marca a corretores, atuários, executivos e reguladores do setor de seguros e resseguros brasileiro.
      </p>

      {/* Números */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 56 }}>
        {[
          { n: "120k+", label: "Usuários únicos/mês" },
          { n: "380k+", label: "Pageviews/mês" },
          { n: "12k", label: "Assinantes newsletter" },
          { n: "78%", label: "Tomadores de decisão" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 16px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 32, fontWeight: 800, color: "var(--green)", lineHeight: 1 }}>{s.n}</p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 6 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Formatos */}
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Formatos disponíveis</h2>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--ink-3)", marginBottom: 24 }}>Escolha o formato que melhor se encaixa nos seus objetivos de comunicação.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 56 }}>
        {FORMATOS.map((f) => (
          <div key={f.nome} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, borderTop: `3px solid ${f.cor}` }}>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{f.nome}</h3>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 12 }}>{f.desc}</p>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: f.cor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.alcance}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: "var(--ink)", borderRadius: 12, padding: "36px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Solicite nosso Mídia Kit completo</h2>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "rgba(255,255,255,.6)", marginBottom: 24 }}>Tabela de preços, especificações técnicas e cases de sucesso.</p>
        <Link href="/contato" style={{ display: "inline-block", borderRadius: 999, background: "var(--green)", padding: "12px 32px", fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 600, color: "#fff" }}>
          Falar com comercial →
        </Link>
      </div>
    </div>
  );
}
