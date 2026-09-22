import Link from "next/link";
import { getMostRead } from "@/lib/data";
import { RankedRow } from "./ArticleCard";
import { PRO_BENEFITS } from "@/lib/tier";

/** Bloco de assinatura da newsletter. */
export function NewsletterWidget() {
  return (
    <section className="rounded-xl border border-hairline bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3.5 7 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink">
          Newsletter
        </h2>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-ink-3">
        Receba nossa curadoria diária de notícias no seu e-mail.
      </p>

      <form className="space-y-2.5">
        <label htmlFor="newsletter-email" className="sr-only">
          Seu e-mail profissional
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="Seu e-mail profissional..."
          className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-4 focus:border-forest-500 focus:bg-white"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-forest-800 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-forest-700"
        >
          Inscrever-se
        </button>
      </form>
    </section>
  );
}

/** Mais lidas da semana. */
export async function MostReadWidget() {
  const articles = await getMostRead(5);

  return (
    <section className="rounded-xl border border-hairline bg-white p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 16 10 10l3.5 3.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink">
          Mais lidas
        </h2>
      </div>

      <ol>
        {articles.map((article, index) => (
          <RankedRow key={article.slug} article={article} position={index + 1} />
        ))}
      </ol>
    </section>
  );
}

/** Chamada para a assinatura PRO. */
export function ProWidget() {
  return (
    <section className="overflow-hidden rounded-xl bg-forest-800 p-6 text-white">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-400">
        Hub Inteligência
      </p>
      <h2 className="mt-2 text-lg font-bold leading-snug">
        O dado que o mercado ainda não viu
      </h2>

      <ul className="mt-4 space-y-2">
        {PRO_BENEFITS.slice(0, 4).map((benefit) => (
          <li key={benefit} className="flex gap-2.5 text-[13px] leading-snug text-forest-200">
            <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="m3 8.5 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>

      <Link
        href="/premium"
        className="mt-5 block rounded-lg bg-lime-400 py-3 text-center text-xs font-semibold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500"
      >
        Conhecer o PRO
      </Link>
    </section>
  );
}

/**
 * Espaço publicitário.
 *
 * Falha de anúncio nunca pode quebrar a página: sem campanha ativa o slot
 * simplesmente não renderiza e o conteúdo ao redor se fecha. No preview não
 * há campanhas, então mostramos o espaço reservado com a marcação do slot —
 * é o que o ad server do sub-projeto 3 vai preencher.
 */
export function AdSlot({
  slot,
  format = "rectangle",
}: {
  slot: string;
  format?: "rectangle" | "leaderboard";
}) {
  const height = format === "leaderboard" ? "h-[90px]" : "h-[250px]";

  return (
    <aside
      className={`flex ${height} flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-white/60`}
      aria-label="Espaço publicitário"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">
        Publicidade
      </p>
      <p className="mt-1 font-mono text-[10px] text-ink-4">slot: {slot}</p>
    </aside>
  );
}
