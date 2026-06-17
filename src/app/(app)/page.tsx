import Link from "next/link";
import MostReadWidget from "@/components/home/MostReadWidget";
import ThermoWidget from "@/components/sidebar/ThermoWidget";
import NewsletterWidget from "@/components/sidebar/NewsletterWidget";
import PremiumWidget from "@/components/sidebar/PremiumWidget";
import CircularesWidget from "@/components/sidebar/CircularesWidget";

/* ─── tipos ───────────────────────────────────────────────── */
interface Story {
  slug: string;
  category: string;
  color: string;
  emoji: string;
  title: string;
  excerpt?: string;
  author?: string;
  time: string;
  dateTime: string;
  readTime?: string;
  exclusive?: boolean;
}

/* ─── dados mock ──────────────────────────────────────────── */
const HERO: Story = {
  slug: "regulacao-susep-2026",
  category: "Regulação",
  color: "#B87214",
  emoji: "⚡",
  title: "SUSEP publica novo marco regulatório para seguros de danos e amplia limites de cobertura obrigatória",
  excerpt: "A autarquia federal publicou nesta segunda-feira a Circular 723/2026, que redefine os critérios mínimos de cobertura para seguros de responsabilidade civil e amplia o escopo de proteção para pequenas e médias empresas. A medida entra em vigor em 90 dias.",
  author: "Redação Segreport",
  time: "Há 30 min",
  dateTime: "2026-06-16T10:00:00-03:00",
  readTime: "5 min",
  exclusive: true,
};

const SECONDARY: Story[] = [
  {
    slug: "irb-brasil-aporte-180-milhoes",
    category: "Resseguros",
    color: "#6B5B95",
    emoji: "🛡️",
    title: "IRB Brasil anuncia aporte de R$180 milhões e mira expansão na América Latina",
    time: "Há 1h",
    dateTime: "2026-06-16T09:30:00-03:00",
  },
  {
    slug: "telemetria-reduz-sinistros-15",
    category: "Auto",
    color: "#0D6E4F",
    emoji: "🚗",
    title: "Telemetria reduz sinistros em 15% entre seguradoras que adotaram monitoramento comportamental",
    time: "Há 2h",
    dateTime: "2026-06-16T08:30:00-03:00",
  },
  {
    slug: "seguro-rural-recorde",
    category: "Agro",
    color: "#7A8C1F",
    emoji: "🌱",
    title: "Seguro rural cresce 22% e bate recorde histórico de contratações no primeiro semestre",
    time: "Há 3h",
    dateTime: "2026-06-16T07:30:00-03:00",
  },
];

const LATEST: Story[] = [
  {
    slug: "ia-generativa-30-atendimentos-seguradoras",
    category: "Tech",
    color: "#1A6FB0",
    emoji: "💻",
    title: "IA generativa já responde por 30% dos atendimentos em seguradoras líderes do Brasil",
    time: "Há 1h",
    dateTime: "2026-06-16T09:30:00-03:00",
  },
  {
    slug: "vida-autonomos",
    category: "Vida",
    color: "#12956A",
    emoji: "❤️",
    title: "Seguradoras de vida ampliam oferta de produtos para trabalhadores autônomos e PJ",
    time: "Há 2h",
    dateTime: "2026-06-16T08:30:00-03:00",
  },
  {
    slug: "ans-susep-integracao",
    category: "Saúde",
    color: "#2B6CB0",
    emoji: "🩺",
    title: "ANS e SUSEP discutem integração de dados entre planos de saúde e seguros médicos",
    time: "Há 3h",
    dateTime: "2026-06-16T07:30:00-03:00",
  },
  {
    slug: "porto-seguro-fintechs",
    category: "Auto",
    color: "#0D6E4F",
    emoji: "🚗",
    title: "Porto Seguro anuncia parceria estratégica com três fintechs de mobilidade urbana",
    time: "Há 4h",
    dateTime: "2026-06-16T06:30:00-03:00",
  },
  {
    slug: "resseguradoras-brasil",
    category: "Resseguros",
    color: "#6B5B95",
    emoji: "🛡️",
    title: "Resseguradoras globais aumentam presença no mercado brasileiro em 34% em 2026",
    time: "Há 5h",
    dateTime: "2026-06-16T05:30:00-03:00",
  },
];

const HIGHLIGHTS: Story[] = [
  {
    slug: "mercado-crescimento-12",
    category: "Mercado",
    color: "#0D6E4F",
    emoji: "📈",
    title: "Mercado segurador brasileiro cresce 12% no primeiro semestre e supera projeções",
    time: "Há 6h",
    dateTime: "2026-06-16T04:30:00-03:00",
  },
  {
    slug: "circular-sinistros",
    category: "Regulação",
    color: "#B87214",
    emoji: "⚡",
    title: "Nova circular simplifica e agiliza processo de regulação de sinistros complexos",
    time: "Há 7h",
    dateTime: "2026-06-16T03:30:00-03:00",
  },
  {
    slug: "fintechs-seguro-captacao",
    category: "Tech",
    color: "#1A6FB0",
    emoji: "💻",
    title: "Fintechs de seguro captam R$2,3 bilhões em rodadas de investimento no primeiro semestre",
    time: "Há 8h",
    dateTime: "2026-06-16T02:30:00-03:00",
  },
];

/* ─── componentes auxiliares ──────────────────────────────── */
function ImagePlaceholder({ color, emoji, ratio = "16/9", height }: { color: string; emoji: string; ratio?: string; height?: number }) {
  return (
    <div
      style={{
        aspectRatio: height ? undefined : ratio,
        height: height ?? undefined,
        background: `linear-gradient(135deg, ${color}22 0%, ${color}dd 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <span style={{ fontSize: height ? 100 : 48, opacity: 0.15, userSelect: "none" }}>{emoji}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle, href, linkText = "Ver todas →" }: { title: string; subtitle: string; href?: string; linkText?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
          {title}
        </h2>
        {href && (
          <Link href={href} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--green)", flexShrink: 0 }}>
            {linkText}
          </Link>
        )}
      </div>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>
        {subtitle}
      </p>
      <div style={{ height: 2, background: "var(--green)", width: 40, marginTop: 10, borderRadius: 2 }} />
    </div>
  );
}

function AdNative() {
  return (
    <section
      aria-label="Publicidade"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--white)",
        padding: "16px 20px",
      }}
    >
      <span style={{ position: "absolute", top: 6, right: 10, fontFamily: "'DM Mono', monospace", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-4)" }}>
        Publicidade
      </span>
      <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 10, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>
        S
      </span>
      <p style={{ flex: 1, fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.4 }}>
        <strong style={{ color: "var(--ink)" }}>Soluções de resseguro sob medida</strong> para a sua carteira. Proteção inteligente para seguradoras e corretores.
      </p>
      <a href="#" style={{ flexShrink: 0, borderRadius: 999, background: "var(--green)", padding: "8px 18px", fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, color: "#fff" }}>
        Saiba mais
      </a>
    </section>
  );
}

/* ─── página principal ────────────────────────────────────── */
export default function Home() {
  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 20px 48px" }} className="lg:px-10">
      <div style={{ display: "grid", gap: 40 }} className="lg:grid-cols-[1fr_360px]">

        {/* ── COLUNA PRINCIPAL ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 40, minWidth: 0 }}>

          {/* HERO */}
          <article aria-label="Matéria principal">
            <Link href={`/noticias/${HERO.slug}`} className="group block">
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", minHeight: 420 }} className="lg:min-h-[480px]">
                <ImagePlaceholder color={HERO.color} emoji={HERO.emoji} height={480} />
                {/* Overlay escuro para legibilidade */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.4) 55%, transparent 100%)" }} />
                {/* Badges */}
                <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", background: HERO.color, color: "#fff", padding: "4px 10px", borderRadius: 4 }}>
                    {HERO.category}
                  </span>
                  {HERO.exclusive && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", background: "var(--amber)", color: "#fff", padding: "4px 10px", borderRadius: 4 }}>
                      Exclusivo
                    </span>
                  )}
                </div>
                {/* Conteúdo sobre a imagem */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 28px 28px" }}>
                  <h1
                    className="group-hover:!text-[var(--green-bg)] transition-colors text-[22px] lg:text-[34px]"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 10 }}
                  >
                    {HERO.title}
                  </h1>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "rgba(255,255,255,.72)", lineHeight: 1.55, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {HERO.excerpt}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,.5)" }}>{HERO.author}</span>
                    <span style={{ color: "rgba(255,255,255,.3)" }}>·</span>
                    <time dateTime={HERO.dateTime} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,.5)" }}>{HERO.time}</time>
                    <span style={{ color: "rgba(255,255,255,.3)" }}>·</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,.5)" }}>{HERO.readTime} de leitura</span>
                  </div>
                </div>
              </div>
            </Link>
          </article>

          {/* GRID SECUNDÁRIO — 3 histórias */}
          <section aria-label="Destaques secundários">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SECONDARY.map((story) => (
                <article key={story.slug}>
                  <Link href={`/noticias/${story.slug}`} className="group block">
                    <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{ aspectRatio: "4/3", background: `linear-gradient(135deg, ${story.color}22 0%, ${story.color}bb 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 40, opacity: 0.2 }}>{story.emoji}</span>
                      </div>
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: story.color, display: "block", marginBottom: 6 }}>
                      {story.category}
                    </span>
                    <h3
                      className="group-hover:!text-[var(--green)] transition-colors"
                      style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: "var(--ink)", marginBottom: 8 }}
                    >
                      {story.title}
                    </h3>
                    <time dateTime={story.dateTime} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-4)" }}>
                      {story.time}
                    </time>
                  </Link>
                </article>
              ))}
            </div>
          </section>

          {/* ÚLTIMAS NOTÍCIAS */}
          <section aria-label="Últimas notícias">
            <SectionHeader
              title="Últimas notícias"
              subtitle="Acompanhe os fatos do mercado segurador em tempo real"
              href="/noticias"
            />
            <ol role="feed" aria-label="Lista de últimas notícias" style={{ listStyle: "none" }}>
              {LATEST.map((story, i) => {
                const isLast = i === LATEST.length - 1;
                return (
                  <li
                    key={story.slug}
                    role="article"
                    aria-posinset={i + 1}
                    aria-setsize={LATEST.length}
                    style={{ borderBottom: isLast ? "none" : "1px solid var(--border)", padding: "14px 0", display: "flex", gap: 16, alignItems: "flex-start" }}
                  >
                    <span aria-hidden="true" style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 300, color: "rgba(0,0,0,.1)", lineHeight: 1, flexShrink: 0, width: 30, paddingTop: 4 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: story.color, display: "block", marginBottom: 5 }}>
                        {story.category}
                      </span>
                      <Link
                        href={`/noticias/${story.slug}`}
                        className="hover:!text-[var(--green)] transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: "var(--ink)", display: "block", marginBottom: 5 }}
                      >
                        {story.title}
                      </Link>
                      <time dateTime={story.dateTime} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-4)" }}>
                        {story.time}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* AD NATIVE */}
          <AdNative />

          {/* DESTAQUES DO DIA */}
          <section aria-label="Destaques do dia">
            <SectionHeader
              title="Destaques do dia"
              subtitle="As principais histórias que estão movimentando o setor segurador"
              href="/noticias"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {HIGHLIGHTS.map((story) => (
                <Link
                  key={story.slug}
                  href={`/noticias/${story.slug}`}
                  className="group"
                  style={{ display: "block" }}
                >
                  <article
                    style={{
                      background: "var(--white)",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    className="group-hover:!border-[var(--green)] group-hover:shadow-sm"
                  >
                    <div style={{ background: `linear-gradient(135deg, ${story.color}15 0%, ${story.color}44 100%)`, padding: "24px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 36, opacity: 0.5 }}>{story.emoji}</span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: story.color, display: "block", marginBottom: 6 }}>
                        {story.category}
                      </span>
                      <h3
                        className="group-hover:!text-[var(--green)] transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: "var(--ink)", marginBottom: 8 }}
                      >
                        {story.title}
                      </h3>
                      <time dateTime={story.dateTime} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-4)" }}>
                        {story.time}
                      </time>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ── SIDEBAR ── */}
        <aside
          className="hidden lg:flex"
          style={{ flexDirection: "column", gap: 24 }}
        >
          <MostReadWidget />
          <ThermoWidget />
          <NewsletterWidget />
          <PremiumWidget />
          <CircularesWidget />
        </aside>
      </div>
    </main>
  );
}
