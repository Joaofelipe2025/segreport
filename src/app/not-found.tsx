import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-forest-800 px-4 text-center text-white">
      <p className="text-2xl font-extrabold italic tracking-[-0.03em]">segreport</p>

      <p className="mt-10 font-mono text-6xl font-bold tracking-[-0.04em] text-lime-400 sm:text-8xl">
        404
      </p>

      <h1 className="mt-5 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
        Esta página não existe
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-forest-200">
        O endereço pode ter mudado ou o conteúdo foi despublicado. Volte para a
        home ou consulte as últimas notícias.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-lime-400 px-6 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500"
        >
          Ir para a home
        </Link>
        <Link
          href="/noticias"
          className="rounded-full border border-white/30 px-6 py-3 text-xs font-extrabold uppercase tracking-[0.06em] transition-colors hover:border-lime-400"
        >
          Ver notícias
        </Link>
      </div>
    </div>
  );
}
