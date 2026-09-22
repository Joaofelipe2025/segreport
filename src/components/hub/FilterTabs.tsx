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
    <div
      className={`inline-flex flex-wrap gap-1 rounded-lg p-1 ${
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
            className={`rounded-md px-3.5 py-2 text-xs font-bold transition-colors sm:text-[13px] ${
              isActive
                ? variant === "lime"
                  ? "bg-lime-400 text-forest-800"
                  : "bg-lime-400 text-forest-800"
                : variant === "lime"
                  ? "text-forest-700 hover:bg-forest-200"
                  : "text-forest-200 hover:bg-forest-700"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
