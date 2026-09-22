import Link from "next/link";
import type { Metadata } from "next";
import { getEvents } from "@/lib/data";
import { EVENT_KIND_LABELS } from "@/lib/data/portal";
import type { MarketEvent } from "@/lib/types";
import { formatMonthYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "Eventos",
  description:
    "Agenda de conferências, webinars e premiações do mercado segurador brasileiro.",
};

const KIND_STYLES: Record<MarketEvent["kind"], string> = {
  conference: "bg-[#efe9fb] text-[#5b3fa0]",
  webinar: "bg-[#e6f0fb] text-[#1f5590]",
  award: "bg-[#fbf0e3] text-[#8a5a12]",
  meetup: "bg-[#e7f5ec] text-[#1e6b40]",
};

export default async function EventsPage() {
  const events = await getEvents();

  // Agrupa por mês preservando a ordem cronológica da consulta.
  const byMonth = new Map<string, MarketEvent[]>();
  for (const event of events) {
    const key = event.date.slice(0, 7);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(event);
    else byMonth.set(key, [event]);
  }

  return (
    <>
      {/* Hero escuro, como no protótipo */}
      <section className="bg-forest-800 text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:py-14 lg:px-8 lg:py-20">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-forest-700 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-lime-400">
                <CalendarIcon className="h-3.5 w-3.5" />
                Agenda 2026
              </span>

              <h1 className="mt-5 text-[32px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
                Os Principais Eventos do
                <br />
                <span className="text-lime-400">Setor de Seguros</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-forest-200">
                Conecte-se com o mercado. Acompanhe conferências, webinars
                estratégicos e premiações exclusivas em um só lugar.
              </p>
            </div>

            <Link
              href="/contato"
              className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-3 text-sm font-extrabold text-forest-800 transition-colors hover:bg-lime-500"
            >
              <span className="text-lg leading-none">+</span>
              Divulgar Evento
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8 lg:py-14">
        {[...byMonth.entries()].map(([month, monthEvents]) => (
          <section key={month} className="mb-12 last:mb-0">
            <h2 className="mb-5 border-b border-hairline pb-3 text-lg font-bold capitalize tracking-[-0.01em] text-ink">
              {formatMonthYear(`${month}-01`)}
            </h2>

            <div className="space-y-4">
              {monthEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function EventRow({ event }: { event: MarketEvent }) {
  const date = new Date(`${event.date}T00:00:00`);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
    .toUpperCase();

  return (
    <article className="flex flex-wrap items-center gap-5 rounded-xl border border-hairline bg-white p-5 transition-shadow hover:shadow-[0_10px_30px_rgba(14,31,20,0.07)]">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-paper">
        <span className="text-xl font-extrabold leading-none text-ink">{day}</span>
        <span className="mt-0.5 text-[10px] font-bold tracking-wide text-ink-3">
          {month}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] ${KIND_STYLES[event.kind]}`}
        >
          {EVENT_KIND_LABELS[event.kind]}
        </span>

        <h3 className="mt-2 text-base font-bold leading-snug text-ink lg:text-lg">
          {event.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-3">{event.summary}</p>

        <p className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-ink-4" />
            {date.toLocaleDateString("pt-BR")} • {event.time}
          </span>
          <span className="flex items-center gap-1.5">
            <PinIcon />
            {event.location}
          </span>
        </p>
      </div>

      <Link
        href="/contato"
        className="shrink-0 rounded-lg border border-hairline px-5 py-2.5 text-xs font-bold text-ink-2 transition-colors hover:border-forest-700 hover:bg-forest-800 hover:text-white"
      >
        Saiba mais
      </Link>
    </article>
  );
}

function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ink-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}
