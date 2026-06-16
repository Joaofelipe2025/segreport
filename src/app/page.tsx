import LeadStory from "@/components/home/LeadStory";
import NewsList from "@/components/home/NewsList";
import NewsGrid from "@/components/home/NewsGrid";
import ThermoWidget from "@/components/sidebar/ThermoWidget";
import NewsletterWidget from "@/components/sidebar/NewsletterWidget";
import RankingWidget from "@/components/sidebar/RankingWidget";
import CircularesWidget from "@/components/sidebar/CircularesWidget";
import PremiumWidget from "@/components/sidebar/PremiumWidget";

function AdNative() {
  return (
    <section
      aria-label="Publicidade"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--white)",
        padding: 14,
        margin: "28px 0",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 6,
          right: 10,
          fontFamily: "'DM Mono', monospace",
          fontSize: 8,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--ink-4)",
        }}
      >
        Publicidade
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: "var(--green)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: "'Poppins', sans-serif",
          fontSize: 14,
          fontWeight: 800,
          color: "#fff",
        }}
      >
        S
      </span>
      <p
        style={{
          flex: 1,
          fontFamily: "'Poppins', sans-serif",
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.4,
        }}
      >
        Conteúdo patrocinado · Soluções de resseguro sob medida para a sua carteira.
      </p>
      <a
        href="#"
        style={{
          flexShrink: 0,
          borderRadius: 999,
          background: "var(--green)",
          padding: "6px 14px",
          fontFamily: "'Poppins', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "#fff",
          whiteSpace: "nowrap",
        }}
      >
        Saiba mais
      </a>
    </section>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ink-3)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </h2>
      <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 20px 100px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 32,
        }}
        className="lg:!grid-cols-[1fr_320px]"
      >
        {/* Coluna principal */}
        <main>
          <LeadStory />

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "28px 0" }} />

          <section aria-label="Últimas notícias">
            <SectionLabel>Últimas notícias</SectionLabel>
            <NewsList />
          </section>

          <AdNative />

          <section aria-label="Destaques do dia">
            <SectionLabel>Destaques do dia</SectionLabel>
            <NewsGrid />
          </section>
        </main>

        {/* Sidebar */}
        <aside
          className="hidden lg:flex"
          style={{ flexDirection: "column", gap: 24 }}
        >
          <ThermoWidget />
          <NewsletterWidget />
          <RankingWidget />
          <CircularesWidget />
          <PremiumWidget />
        </aside>
      </div>
    </div>
  );
}
