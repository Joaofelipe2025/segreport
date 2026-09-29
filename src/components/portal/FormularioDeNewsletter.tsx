"use client";

import { useActionState } from "react";
import {
  inscreverNaNewsletter,
  type EstadoDaNewsletter,
} from "@/app/(portal)/newsletter/actions";

const INICIAL: EstadoDaNewsletter = { status: "inicial" };

/**
 * O formulário que antes não fazia nada.
 *
 * Era um `<form>` sem `action`: submeter recarregava a página e o e-mail
 * sumia. O site prometia "curadoria diária" e descartava o endereço em
 * silêncio — promessa quebrada é pior do que campo ausente.
 */
export default function FormularioDeNewsletter() {
  const [estado, acao, pendente] = useActionState(inscreverNaNewsletter, INICIAL);

  if (estado.status === "inscrito") {
    return (
      <p
        role="status"
        className="rounded-lg bg-forest-100 px-4 py-3 text-sm leading-relaxed text-forest-800"
      >
        {estado.mensagem}
      </p>
    );
  }

  return (
    <form action={acao} className="space-y-2.5">
      <label htmlFor="newsletter-email" className="sr-only">
        Seu e-mail profissional
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Seu e-mail profissional..."
        className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-4 focus:border-forest-500 focus:bg-white"
      />
      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-lg bg-forest-800 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
      >
        {pendente ? "Inscrevendo…" : "Inscrever-se"}
      </button>

      {estado.status === "erro" && (
        <p role="alert" className="text-xs leading-relaxed text-down">
          {estado.mensagem}
        </p>
      )}
    </form>
  );
}
