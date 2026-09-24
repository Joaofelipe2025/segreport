"use client";

import { useActionState } from "react";
import { convidarColunista, type EstadoConvite } from "./actions";

const INICIAL: EstadoConvite = { status: "inicial" };

const CAMPOS = [
  { id: "nome", rotulo: "Nome completo", tipo: "text", obrigatorio: true },
  { id: "email", rotulo: "E-mail", tipo: "email", obrigatorio: true },
  { id: "cargo", rotulo: "Cargo na assinatura", tipo: "text", obrigatorio: false },
] as const;

export default function FormularioConvite() {
  const [estado, acao, pendente] = useActionState(convidarColunista, INICIAL);

  return (
    <form action={acao} className="h-fit rounded-xl border border-hairline bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink">
        Convidar colunista
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
        Ele recebe um link por e-mail e entra sem senha.
      </p>

      <div className="mt-4 space-y-3">
        {CAMPOS.map((campo) => (
          <div key={campo.id}>
            <label
              htmlFor={campo.id}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-2"
            >
              {campo.rotulo}
            </label>
            <input
              id={campo.id}
              name={campo.id}
              type={campo.tipo}
              required={campo.obrigatorio}
              className="w-full rounded-lg border border-hairline bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-forest-500 focus:bg-white"
            />
          </div>
        ))}
      </div>

      {estado.mensagem && (
        <p
          role="status"
          className={`mt-3 text-xs leading-relaxed ${
            estado.status === "erro" ? "text-down" : "text-forest-700"
          }`}
        >
          {estado.mensagem}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="mt-4 w-full rounded-lg bg-forest-800 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
      >
        {pendente ? "Enviando…" : "Enviar convite"}
      </button>
    </form>
  );
}
