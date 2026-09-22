import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentTier, getReports } from "@/lib/data";
import { LockIcon, TierBadge } from "@/components/ui/Badge";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Relatórios" };

export default async function RelatoriosPage() {
  const tier = await getCurrentTier();
  const reports = await getReports(tier);

  return (
    <div className="space-y-7">
      <header>
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
          Biblioteca de relatórios
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">
          Análises aprofundadas em PDF, com metodologia e fonte declaradas em
          cada edição.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map(({ report, locked }) => (
          <article
            key={report.id}
            className="flex min-h-[188px] flex-col justify-between rounded-xl bg-forest-800 p-5 text-white sm:p-6"
          >
            <div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-700 text-lime-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M6 3h8l4 4v14H6z" strokeLinejoin="round" />
                    <path d="M14 3v4h4M9 13h6M9 17h4" strokeLinecap="round" />
                  </svg>
                </span>
                {report.minTier !== "free" && <TierBadge tier={report.minTier} />}
              </div>

              <h3 className="text-base font-bold leading-snug sm:text-lg">
                {report.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-forest-200">
                {report.summary}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="font-mono text-[11px] uppercase text-forest-500">
                {formatDateShort(report.publishedAt)} · {report.pages} páginas
              </p>

              {locked ? (
                <Link
                  href="/premium"
                  className="inline-flex items-center gap-1.5 rounded-md bg-lime-400/15 px-3 py-1.5 text-[11px] font-bold text-lime-400 transition-colors hover:bg-lime-400/25"
                >
                  <LockIcon className="h-2.5 w-2.5" />
                  Liberar acesso
                </Link>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md bg-lime-400 px-3 py-1.5 text-[11px] font-bold text-forest-800 transition-colors hover:bg-lime-500"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 2v8M4.5 7 8 10.5 11.5 7M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Baixar PDF
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
