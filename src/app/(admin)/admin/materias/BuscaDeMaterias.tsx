"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Busca por título e endereço.
 *
 * Formulário de verdade, com navegação: o termo fica na URL, então o
 * resultado é compartilhável, sobrevive a recarregar e funciona com o botão
 * de voltar. Busca instantânea a cada tecla pareceria mais moderna e faria
 * uma consulta por letra digitada.
 *
 * O texto da matéria não entra na busca: `content_text` está revogada de
 * `authenticated` para fechar o paywall. A tela diz isso quando não acha
 * nada, em vez de deixar a pessoa concluir que a matéria sumiu.
 */
export default function BuscaDeMaterias({
  busca,
  estado,
}: {
  busca: string;
  estado: string;
}) {
  const router = useRouter();
  const [termo, setTermo] = useState(busca);

  function navegar(valor: string) {
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    if (valor.trim()) params.set("busca", valor.trim());
    const qs = params.toString();
    router.push(qs ? `/admin/materias?${qs}` : "/admin/materias");
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navegar(termo);
      }}
      className="relative flex-1 sm:max-w-xs"
    >
      <label htmlFor="busca" className="sr-only">
        Buscar matéria por título ou endereço
      </label>
      <input
        id="busca"
        name="busca"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar por título ou endereço"
        className="w-full rounded-lg border border-hairline bg-white px-3 py-2 pr-16 text-sm outline-none transition-colors focus:border-forest-500"
      />
      {busca && (
        <button
          type="button"
          onClick={() => {
            setTermo("");
            navegar("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] font-medium text-ink-3 transition-colors hover:text-forest-700"
        >
          limpar
        </button>
      )}
    </form>
  );
}
