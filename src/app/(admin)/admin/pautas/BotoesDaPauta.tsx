"use client";

import { useState, useTransition } from "react";
import { mudarEstadoDaPauta } from "./actions";

/**
 * Duas saídas para cada pauta: virou trabalho, ou não interessa.
 *
 * "Lida" existe para o que você quer guardar sem agir agora; "descartada"
 * para o ruído. Os dois somem da lista principal, e a diferença fica no
 * histórico — que é o registro do que o veículo viu e decidiu não cobrir.
 */
export default function BotoesDaPauta({ id }: { id: string }) {
  const [aviso, setAviso] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  const mudar = (estado: string) =>
    iniciar(async () => {
      const r = await mudarEstadoDaPauta(id, estado);
      if (r.status === "erro") setAviso(r.mensagem);
    });

  return (
    <span className="flex shrink-0 items-center gap-2">
      {aviso && (
        <span role="alert" className="text-[11px] text-down">
          {aviso}
        </span>
      )}
      <button
        type="button"
        disabled={ocupado}
        onClick={() => mudar("lida")}
        className="rounded border border-hairline px-2 py-1 text-[11px] font-medium text-ink-2 transition-colors hover:border-forest-500 disabled:opacity-50"
      >
        Guardar
      </button>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => mudar("descartada")}
        className="rounded px-2 py-1 text-[11px] font-medium text-ink-4 transition-colors hover:text-down disabled:opacity-50"
      >
        Descartar
      </button>
    </span>
  );
}
