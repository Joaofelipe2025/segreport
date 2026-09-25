"use client";

import { useState, useTransition } from "react";
import { descartarRascunhosVazios } from "./actions";

/**
 * Limpeza dos rascunhos que nunca receberam texto.
 *
 * Mostra a lista ANTES de apagar, com o endereço de cada um. Exclusão em
 * massa atrás de um botão que só diz "limpar" é um acidente esperando
 * acontecer — quem clica precisa ver o que está indo embora.
 *
 * Só aparece quando há o que limpar, e só para admin.
 */
export default function LimparRascunhosVazios({
  rascunhos,
}: {
  rascunhos: Array<{ id: string; slug: string; title: string }>;
}) {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState<string>();
  const [processando, iniciar] = useTransition();

  return (
    <div className="rounded-xl border border-hairline bg-white p-5">
      <p className="text-sm leading-relaxed text-ink-2">
        {rascunhos.length === 1
          ? "Há 1 rascunho que nunca recebeu texto."
          : `Há ${rascunhos.length} rascunhos que nunca receberam texto.`}{" "}
        <span className="text-ink-3">
          São restos do fluxo antigo, em que clicar em “Nova matéria” já criava
          a linha antes de existir qualquer conteúdo. Nenhum deles tem uma
          palavra escrita.
        </span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="text-xs font-medium text-forest-700 hover:underline"
        >
          {aberto ? "Ocultar a lista" : "Ver o que será apagado"}
        </button>
        {aviso && <span className="text-xs text-ink-3">{aviso}</span>}
      </div>

      {aberto && (
        <>
          <ul className="mt-3 divide-y divide-hairline rounded-lg border border-hairline">
            {rascunhos.map((r) => (
              <li key={r.id} className="flex items-baseline gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-xs text-ink-2">{r.title}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-4">/{r.slug}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={processando}
            onClick={() =>
              iniciar(async () => {
                const r = await descartarRascunhosVazios();
                setAviso(r.mensagem);
              })
            }
            className="mt-3 rounded-lg border border-down px-4 py-2 text-xs font-semibold text-down transition-colors hover:bg-down hover:text-white disabled:opacity-50"
          >
            {processando
              ? "Apagando…"
              : `Apagar ${rascunhos.length === 1 ? "este rascunho" : `estes ${rascunhos.length} rascunhos`}`}
          </button>
        </>
      )}
    </div>
  );
}
