import Link from "next/link";

const TOP_10 = [
  { pos: 1, cat: "Regulação", href: "/noticias/regulacao-susep-2026", title: "SUSEP publica novo marco regulatório para seguros de danos e amplia limites de cobertura" },
  { pos: 2, cat: "Resseguros", href: "/noticias/irb-brasil-aporte-180-milhoes", title: "IRB Brasil anuncia aporte de R$180M e mira expansão na América Latina" },
  { pos: 3, cat: "Auto", href: "/noticias/telemetria-reduz-sinistros-15", title: "Telemetria reduz sinistros em 15% entre seguradoras pioneiras" },
  { pos: 4, cat: "Agro", href: "#", title: "Seguro rural cresce 22% e bate recorde de contratações no semestre" },
  { pos: 5, cat: "Tech", href: "#", title: "IA generativa já responde por 30% dos atendimentos em seguradoras líderes" },
  { pos: 6, cat: "Auto", href: "#", title: "Porto Seguro anuncia parceria com três fintechs de mobilidade urbana" },
  { pos: 7, cat: "Resseguros", href: "#", title: "Resseguradoras globais aumentam presença no mercado brasileiro em 2026" },
  { pos: 8, cat: "Regulação", href: "#", title: "Nova circular simplifica processo de regulação de sinistros complexos" },
  { pos: 9, cat: "Vida", href: "#", title: "Seguradoras de vida ampliam oferta para trabalhadores autônomos" },
  { pos: 10, cat: "Tech", href: "#", title: "Fintechs de seguro captam R$2,3 bilhões em rodadas de investimento" },
];

export default function MostReadWidget() {
  return (
    <section aria-label="Top 10 mais lidas" style={{ background: "var(--green)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          Últimas 24 horas
        </p>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          Top 10 Mais lidas
        </h2>
      </div>

      <ol style={{ listStyle: "none" }}>
        {TOP_10.map((item, i) => (
          <li key={item.pos} style={{ borderBottom: i < 9 ? "1px solid rgba(255,255,255,.07)" : "none" }}>
            <Link
              href={item.href}
              className="hover:bg-[rgba(0,0,0,.12)] transition-colors"
              style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 20px" }}
            >
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,.18)", lineHeight: 1, flexShrink: 0, width: 26, paddingTop: 2 }}>
                {String(item.pos).padStart(2, "0")}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 3 }}>
                  {item.cat}
                </span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 500, color: "#fff", lineHeight: 1.45 }}>
                  {item.title}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,.1)", textAlign: "center" }}>
        <Link href="/noticias" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,.6)", textDecoration: "underline" }}>
          Ver todas as notícias →
        </Link>
      </div>
    </section>
  );
}
