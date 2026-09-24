export default function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-3">
            {descricao}
          </p>
        )}
      </div>
      {acao}
    </div>
  );
}
