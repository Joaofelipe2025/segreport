import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAuthors } from "@/lib/data";

export const metadata: Metadata = {
  title: "Colunistas",
  description:
    "Análise assinada por especialistas em regulação, tecnologia, saúde, resseguros e agronegócio.",
};

export default async function ColunistasPage() {
  const columnists = await getAuthors(true);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <header className="mb-8 border-l-[4px] border-lime-400 pl-4">
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-[40px]">
          Colunistas
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-3">
          Especialistas que acompanham o setor de dentro. Opinião assinada,
          separada da cobertura da redação.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {columnists.map((author) => (
          <Link
            key={author.slug}
            href={`/colunistas/${author.slug}`}
            className="group flex gap-4 rounded-xl border border-hairline bg-white p-5 transition-all hover:border-forest-500 hover:shadow-[0_10px_28px_rgba(14,31,20,0.08)]"
          >
            <Image
              src={author.avatar}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink transition-colors group-hover:text-forest-700">
                {author.name}
              </h2>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-forest-600">
                {author.role}
              </p>
              <p className="clamp-3 mt-2 text-[13px] leading-relaxed text-ink-3">
                {author.bio}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
