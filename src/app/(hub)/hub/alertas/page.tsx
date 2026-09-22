import type { Metadata } from "next";
import { getCurrentTier, getIndicators } from "@/lib/data";
import { UpsellBlock, DataPanel } from "@/components/hub/DataBlocks";
import { LockIcon } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Alertas" };

/**
 * Regras de alerta.
 *
 * No preview a tela mostra o formulário real, desabilitado para o plano
 * gratuito. Salvar a regra depende do login (sub-projeto 1, fase de auth) e
 * o disparo depende do agendador (sub-projeto 4).
 */
export default async function AlertasPage() {
  const tier = await getCurrentTier();
  const indicators = await getIndicators(tier);
  const isFree = tier === "free";

  return (
    <div className="space-y-7">
      <header>
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
          Alertas de indicador
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">
          Receba um e-mail quando um indicador variar acima do limite que você
          definir. A verificação roda a cada fechamento de período.
        </p>
      </header>

      <DataPanel title="Nova regra de alerta">
        <form className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="alerta-indicador" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-forest-300">
              Indicador
            </label>
            <select
              id="alerta-indicador"
              disabled={isFree}
              className="w-full rounded-lg border border-white/12 bg-forest-900 px-3.5 py-3 text-sm text-white outline-none transition-colors focus:border-lime-400/60 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {indicators.map(({ definition }) => (
                <option key={definition.key} value={definition.key}>
                  {definition.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alerta-limite" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-forest-300">
              Variação mínima (pontos percentuais)
            </label>
            <input
              id="alerta-limite"
              type="number"
              step="0.1"
              defaultValue="1.0"
              disabled={isFree}
              className="w-full rounded-lg border border-white/12 bg-forest-900 px-3.5 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-lime-400/60 disabled:cursor-not-allowed disabled:opacity-55"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={isFree}
              className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500 disabled:cursor-not-allowed disabled:bg-forest-700 disabled:text-forest-500"
            >
              {isFree && <LockIcon className="h-3 w-3" />}
              Criar alerta
            </button>
          </div>
        </form>
      </DataPanel>

      {isFree && (
        <UpsellBlock
          headline="Alertas são um recurso do plano PRO"
          detail="Assinantes recebem aviso por e-mail no dia em que o indicador fecha fora do limite definido, antes de a análise ser publicada no portal."
        />
      )}
    </div>
  );
}
