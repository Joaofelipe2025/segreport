import Link from "next/link";

/**
 * Filtros por link.
 *
 * Trocar o filtro navega para a mesma rota com outra query, e o servidor
 * devolve o recorte já filtrado. Isso mantém o corte de dados no servidor —
 * importante aqui, porque filtrar no cliente exigiria enviar ao navegador
 * também o que o plano do usuário não permite ver.
 *
 * Efeito colateral bom: cada recorte tem URL própria, compartilhável.
 */
export default function FilterTabs({
  options,
  active,
  paramName,
  basePath,
  extraParams,
  variant = "dark",
}: {
  options: { value: string; label: string }[];
  active: string;
  paramName: string;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
  variant?: "dark" | "lime";
}) {
  const buildHref = (value: string) => {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(extraParams ?? {})) {
      if (val) params.set(key, val);
    }
    if (value) params.set(paramName, value);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    // `max-w-full` + rolagem horizontal: com sete ramos, envolver em duas
    // linhas num celular empurra o conteúdo para baixo e quebra o ritmo da
    // página. Rolar mantém o grupo como uma peça só.
    <div
      className={`no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-lg p-1 ${
        variant === "lime" ? "bg-forest-100" : "bg-forest-800"
      }`}
      role="group"
    >
      {options.map((option) => {
        const isActive = option.value === active;
        return (
          <Link
            key={option.value || "todos"}
            href={buildHref(option.value)}
            aria-current={isActive ? "true" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:px-3.5 sm:text-[13px] ${
              isActive
                ? "bg-lime-400 text-forest-800 shadow-[0_2px_8px_rgba(178,224,47,0.25)]"
                : variant === "lime"
                  ? "text-forest-700 hover:bg-forest-200"
                  : "text-forest-200 hover:bg-white/8"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
