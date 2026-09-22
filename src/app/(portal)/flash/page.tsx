import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getFlashPosts } from "@/lib/data";
import { formatDateShort } from "@/lib/format";
import { AdSlot } from "@/components/portal/Sidebar";

export const metadata: Metadata = {
  title: "Flash do Mercado",
  description:
    "Cobertura fotográfica de congressos, premiações e encontros do mercado segurador.",
};

export default async function FlashPage() {
  const posts = await getFlashPosts();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <header className="mb-8 border-l-[4px] border-lime-400 pl-4">
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-[40px]">
          Flash do Mercado
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-3">
          Quem esteve onde. Cobertura fotográfica dos congressos, premiações e
          encontros que movimentam o setor.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/flash/${post.slug}`}
            className="group relative overflow-hidden rounded-xl bg-forest-800"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={post.cover}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/25 to-transparent" />
            </div>

            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded bg-lime-400 px-2.5 py-1 text-[11px] font-semibold text-forest-800">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d="M9.4 4h5.2l1.1 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.3zM12 9.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5" />
              </svg>
              {post.photoCount}
            </span>

            <div className="absolute inset-x-0 bottom-0 p-4">
              <h2 className="text-balance text-base font-semibold leading-tight text-white lg:text-lg">
                {post.title}
              </h2>
              <p className="mt-1.5 text-xs text-forest-300">
                {post.venue} · {formatDateShort(post.date)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <AdSlot slot="flash-rodape" format="leaderboard" />
      </div>
    </div>
  );
}
