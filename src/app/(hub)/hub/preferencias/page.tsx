import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentTier } from "@/lib/data";
import { DataPanel } from "@/components/hub/DataBlocks";
import { BRANCHES, BRANCH_LABELS } from "@/lib/categories";
import { TIER_LABELS } from "@/lib/tier";

export const metadata: Metadata = { title: "Preferências" };

export default async function PreferenciasPage() {
  const tier = await getCurrentTier();

  return (
    <div className="space-y-7">
      <header>
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
          Preferências
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">
          Escolha quais ramos aparecem primeiro no seu painel e como você quer
          receber as comunicações.
        </p>
      </header>

      <DataPanel title="Ramos de interesse">
        <div className="flex flex-wrap gap-2.5 p-5 sm:p-6">
          {BRANCHES.map((branch) => (
            <label
              key={branch}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-forest-100 transition-colors hover:border-lime-400/50 hover:bg-forest-700"
            >
              <input
                type="checkbox"
                defaultChecked
                className="h-3.5 w-3.5 accent-lime-400"
              />
              {BRANCH_LABELS[branch]}
            </label>
          ))}
        </div>
      </DataPanel>

      <DataPanel title="Sua conta">
        <dl className="divide-y divide-white/8">
          <Row label="Plano atual" value={TIER_LABELS[tier]} />
          <Row label="E-mail" value="Não conectado — faça login para configurar" />
          <Row
            label="Frequência da newsletter"
            value="Diária, às 7h"
          />
        </dl>

        <div className="border-t border-white/10 px-5 py-5 sm:px-6">
          <p className="text-sm text-forest-200">
            O login ainda não está ligado neste preview. As preferências passam
            a ser salvas quando a autenticação entrar.
          </p>
          <Link
            href="/premium"
            className="mt-4 inline-block rounded-full bg-lime-400 px-6 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500"
          >
            Conhecer os planos
          </Link>
        </div>
      </DataPanel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
      <dt className="text-sm text-forest-300">{label}</dt>
      <dd className="text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}
