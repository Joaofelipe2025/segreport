"use client";

import { useActionState } from "react";
import { salvarAssinatura, type EstadoAjustes } from "./actions";

const INICIAL: EstadoAjustes = { status: "inicial" };

export default function FormularioDeAssinatura({
  nome,
  bio,
  slug,
}: {
  nome: string;
  bio: string;
  slug: string;
}) {
  const [estado, acao, pendente] = useActionState(salvarAssinatura, INICIAL);

  return (
    <form action={acao} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3"
        >
          Nome da assinatura
        </label>
        <input
          id="name"
          name="name"
          defaultValue={nome}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
        />
        <p className="mt-1.5 text-[11px] text-ink-4">
          É o que aparece assinando a matéria.
        </p>
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3"
        >
          Endereço da sua página
        </label>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[12px] text-ink-4">/colunistas/</span>
          <input
            id="slug"
            name="slug"
            defaultValue={slug}
            placeholder="seu-nome"
            className="min-w-0 flex-1 rounded-lg border border-hairline bg-white px-3 py-2 font-mono text-[12px] outline-none focus:border-forest-500"
          />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-4">
          Mudar isto quebra os links já publicados para a sua página. Só troque
          se ainda não houver nada apontando para cá. Em branco, o endereço é
          gerado a partir do nome.
        </p>
      </div>

      <div>
        <label
          htmlFor="bio"
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3"
        >
          Minibiografia
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={bio}
          rows={3}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-forest-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
        >
          {pendente ? "Salvando…" : "Salvar assinatura"}
        </button>
        {estado.status === "salvo" && (
          <span className="text-xs text-forest-700">{estado.mensagem}</span>
        )}
        {estado.status === "erro" && (
          <span role="alert" className="text-xs text-down">
            {estado.mensagem}
          </span>
        )}
      </div>
    </form>
  );
}
