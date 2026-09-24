"use client";

import { useActionState } from "react";
import { enviarLinkMagico, type EstadoLogin } from "./actions";

const INICIAL: EstadoLogin = { status: "inicial" };

const MOTIVOS: Record<string, string> = {
  sessao: "Sua sessão expirou. Entre novamente.",
  permissao: "Sua conta não tem acesso a essa área.",
  "link-invalido": "O link está incompleto. Peça outro.",
  "link-expirado": "O link expirou. Peça um novo abaixo.",
};

export default function LoginForm({ motivo }: { motivo?: string }) {
  const [estado, acao, pendente] = useActionState(enviarLinkMagico, INICIAL);
  const aviso = motivo ? MOTIVOS[motivo] : undefined;

  if (estado.status === "enviado") {
    return (
      <div className="rounded-lg border border-hairline bg-forest-100 px-5 py-7 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-forest-800 text-lime-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3.5 7 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-3 text-sm font-semibold text-forest-800">
          Verifique seu e-mail
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">{estado.mensagem}</p>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      {aviso && (
        <p
          role="status"
          className="rounded-lg border border-hairline bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink-2"
        >
          {aviso}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-2"
        >
          E-mail profissional
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-4 focus:border-forest-500 focus:bg-white"
        />
      </div>

      {estado.status === "erro" && (
        <p role="alert" className="text-sm text-down">
          {estado.mensagem}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-lg bg-forest-800 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
      >
        {pendente ? "Enviando…" : "Receber link de acesso"}
      </button>

      <p className="pt-1 text-center text-[13px] leading-relaxed text-ink-3">
        O acesso é sem senha. Enviamos um link que entra direto.
      </p>
    </form>
  );
}
