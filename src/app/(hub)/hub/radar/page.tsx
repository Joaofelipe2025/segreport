import type { Metadata } from "next";
import { getCurrentTier, getRadarSignals } from "@/lib/data";
import { ImpactBadge } from "@/components/ui/Badge";
import { UpsellBlock } from "@/components/hub/DataBlocks";
import FilterTabs from "@/components/hub/FilterTabs";
import { formatDateShort } from "@/lib/format";
import type { Impact } from "@/lib/types";

export const metadata: Metadata = { title: "Radar" };

const CATEGORY_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "Regulação", label: "Regulação" },
  { value: "Tecnologia", label: "Tecnologia" },
  { value: "Mercado", label: "Mercado" },
  { value: "Agronegócio", label: "Agronegócio" },
  { value: "Cyber", label: "Cyber" },
  { value: "Resseguros", label: "Resseguros" },
];

/** Cor do filete lateral por nível de impacto. */
const IMPACT_BAR: Record<Impact, string> = {
  critical: "bg-impact-critical",
  high: "bg-impact-high",
  medium: "bg-impact-medium",
  low: "bg-impact-low",
};

export default async function RadarPage(props: PageProps<"/hub/radar">) {
  const params = await props.searchParams;
  const category = typeof params.categoria === "string" ? params.categoria : "";

  const tier = await getCurrentTier();
  const { signals, hiddenCount } = await getRadarSignals(tier);

  const visible = category
    ? signals.filter((s) => s.category === category)
    : signals;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
          Radar de tendências
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">
          Movimentos que ainda não viraram notícia, classificados pelo impacto
          esperado sobre a operação das seguradoras.
        </p>
      </header>

      <FilterTabs
        options={CATEGORY_OPTIONS}
        active={category}
        paramName="categoria"
        basePath="/hub/radar"
      />

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline bg-white/60 px-6 py-14 text-center text-sm text-ink-3">
          Nenhum sinal nesta categoria no momento.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((signal) => (
            <article
              key={signal.id}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-forest-800 to-forest-900 p-4 pl-6 text-white ring-1 ring-white/8 transition-all duration-300 hover:ring-white/16 sm:p-6 sm:pl-8"
            >
              {/* Filete de impacto: a leitura mais rápida da lista inteira */}
              <span
                className={`absolute inset-y-0 left-0 w-1.5 ${IMPACT_BAR[signal.impact]}`}
                aria-hidden="true"
              />

              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-forest-200">
                    {signal.category}
                  </span>
                  <ImpactBadge impact={signal.impact} />
                </div>
                <time
                  dateTime={signal.date}
                  className="font-mono text-[10px] uppercase tracking-wide text-forest-500 sm:text-[11px]"
                >
                  {formatDateShort(signal.date)}
                </time>
              </div>

              <h3 className="mt-3 text-balance text-base font-bold leading-snug sm:text-xl">
                {signal.title}
              </h3>
              <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-forest-200 sm:text-sm">
                {signal.summary}
              </p>

              {signal.links.length > 0 && (
                <p className="mt-3.5 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-forest-500">Links:</span>
                  {signal.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-lime-400 transition-colors hover:text-lime-300"
                    >
                      {link.label}
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 2h6v6M10 2 3 9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {hiddenCount > 0 && (
        <UpsellBlock
          headline={`Mais ${hiddenCount} ${hiddenCount === 1 ? "sinal monitorado" : "sinais monitorados"} no plano PRO`}
          detail="Sinais de impacto crítico e alto chegam primeiro para assinantes, com alerta por e-mail no dia da detecção."
        />
      )}
    </div>
  );
}
