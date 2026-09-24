"use client";

import { useActionState } from "react";
import { enviarLinkDaRedacao, type EstadoDaPorta } from "./actions";

const INICIAL: EstadoDaPorta = { status: "inicial" };

export default function Formulario() {
  const [estado, acao, pendente] = useActionState(enviarLinkDaRedacao, INICIAL);

  return (
    <form action={acao} className="mt-8">
      <label
        htmlFor="email"
        className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-forest-300"
      >
        E-mail da redação
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        autoFocus
        placeholder="voce@segreport.com.br"
        className="mt-2 w-full rounded-lg border border-forest-600 bg-forest-800 px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-forest-400 focus:border-lime-400"
      />

      <button
        type="submit"
        disabled={pendente}
        className="mt-4 w-full rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-forest-900 transition-colors hover:bg-lime-500 disabled:opacity-60"
      >
        {pendente ? "Enviando…" : "Receber link de acesso"}
      </button>

      {estado.status === "enviado" && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-forest-800 px-4 py-3 text-[13px] leading-relaxed text-forest-200"
        >
          {estado.mensagem}
        </p>
      )}
      {estado.status === "erro" && (
        <p role="alert" className="mt-4 text-[13px] text-[#ff9b8a]">
          {estado.mensagem}
        </p>
      )}
    </form>
  );
}
