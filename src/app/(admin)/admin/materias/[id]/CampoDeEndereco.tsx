"use client";

import { useState } from "react";
import { enderecoAPartirDoTitulo, enderecoEstaCongelado } from "@/lib/painel/fluxo";

/**
 * O endereço da matéria, derivado do título.
 *
 * Era um campo manual no trilho lateral, e o portão de publicação exigia
 * trocá-lo antes de publicar — uma tarefa a mais em cima de quem está
 * fechando matéria, para produzir exatamente o que o título já dizia.
 *
 * Fica embaixo do título porque é consequência dele, não metadado: ver os
 * dois juntos é o que torna óbvio de onde o endereço saiu.
 *
 * Depois de publicada, congela. Trocar o endereço de matéria no ar
 * transforma em 404 todo link compartilhado, indexado ou citado, e não há
 * redirecionamento — o título pode ser corrigido, o endereço não.
 */
export default function CampoDeEndereco({
  titulo,
  inicial,
  status,
  ehAdmin,
}: {
  titulo: string;
  inicial: string;
  status: string;
  ehAdmin: boolean;
}) {
  const [manual, setManual] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);

  const congelado = enderecoEstaCongelado(status);
  const derivado = enderecoAPartirDoTitulo(titulo, inicial, status);
  const valor = manual ?? derivado;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <input type="hidden" name="slug" value={valor} />

      <span className="font-mono text-[12px] text-ink-4">/noticias/</span>

      {editando ? (
        <input
          autoFocus
          value={valor}
          onChange={(e) => setManual(e.target.value)}
          onBlur={() => setEditando(false)}
          aria-label="Endereço da matéria"
          className="min-w-0 flex-1 rounded border border-hairline bg-white px-2 py-1 font-mono text-[12px] outline-none focus:border-forest-500"
        />
      ) : (
        <span className="min-w-0 truncate font-mono text-[12px] text-ink-3">
          {valor || <span className="text-ink-4">sai do título</span>}
        </span>
      )}

      {ehAdmin && !editando && (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-[11px] font-medium text-forest-700 hover:underline"
        >
          editar
        </button>
      )}

      {manual !== null && !editando && (
        <button
          type="button"
          onClick={() => setManual(null)}
          className="text-[11px] font-medium text-ink-4 hover:text-forest-700"
        >
          voltar ao título
        </button>
      )}

      {congelado && (
        <span className="text-[11px] text-ink-4">
          · congelado: a matéria está no ar e o link não muda
        </span>
      )}
    </div>
  );
}
