import Link from "next/link";

/**
 * Cabeçalho de seção com o filete lima à esquerda.
 *
 * O filete é a assinatura visual que amarra portal e Hub sem usar lima como
 * texto — que sobre fundo claro seria ilegível.
 */
export default function SectionHeading({
  title,
  href,
  linkLabel = "Ver mais",
  icon,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="flex items-center gap-2.5 border-l-[4px] border-lime-400 pl-3 text-xl font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
        {icon && <span className="text-forest-600">{icon}</span>}
        {title}
      </h2>

      {href && (
        <Link
          href={href}
          className="group shrink-0 whitespace-nowrap text-sm font-semibold text-ink-3 transition-colors hover:text-forest-700"
        >
          {linkLabel}
          <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
