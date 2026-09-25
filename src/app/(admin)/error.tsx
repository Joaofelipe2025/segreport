"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Última linha do painel.
 *
 * O texto técnico aparece porque isto é ferramenta interna: quem vê esta tela
 * é a redação, e esconder o erro dela não protege ninguém — só transforma um
 * problema diagnosticável em "o sistema não funciona".
 *
 * Em produção o Next troca a mensagem de erro de componente de servidor por
 * um `digest`, e nada mais atravessa a fronteira. Por isso o digest aparece
 * em destaque: é o que liga esta tela à linha do log do servidor.
 */
export default function ErroDoPainel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[painel]", error);
  }, [error]);

  const detalhe = (error as Error & { detalhe?: string }).detalhe;

  return (
    <div className="max-w-xl rounded-xl border border-hairline bg-white p-6">
      <h1 className="text-lg font-semibold text-ink">Alguma coisa falhou aqui</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-3">
        {error.message || "Erro inesperado no painel."}
      </p>

      {(detalhe || error.digest) && (
        <p className="mt-3 overflow-x-auto rounded-lg bg-paper px-3 py-2 font-mono text-[12px] text-ink-3">
          {detalhe}
          {detalhe && error.digest ? " · " : ""}
          {error.digest}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-forest-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest-700"
        >
          Tentar de novo
        </button>
        <Link
          href="/admin/materias"
          className="text-xs font-medium text-forest-700 hover:underline"
        >
          Voltar para as matérias
        </Link>
      </div>
    </div>
  );
}
