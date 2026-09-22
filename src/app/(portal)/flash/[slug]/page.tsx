import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FLASH_POSTS } from "@/lib/data/portal";
import { photo } from "@/lib/data/media";
import { formatDateLong } from "@/lib/format";
import { AdSlot } from "@/components/portal/Sidebar";

export function generateStaticParams() {
  return FLASH_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/flash/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = FLASH_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Galeria não encontrada" };

  return {
    title: post.title,
    description: `${post.photoCount} fotos · ${post.venue}`,
  };
}

export default async function FlashGalleryPage(props: PageProps<"/flash/[slug]">) {
  const { slug } = await props.params;
  const post = FLASH_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  // Fotos da galeria derivadas do slug — estáveis entre renderizações.
  const photos = Array.from({ length: Math.min(post.photoCount, 18) }, (_, i) => ({
    src: photo(`${post.slug}-${i}`, 800, 600),
    alt: `${post.title} — foto ${i + 1}`,
  }));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <nav aria-label="Trilha" className="mb-5 text-xs font-medium text-ink-3">
        <Link href="/" className="hover:text-forest-700">
          Home
        </Link>
        <span className="mx-2 text-ink-4">/</span>
        <Link href="/flash" className="hover:text-forest-700">
          Flash do Mercado
        </Link>
      </nav>

      <header className="mb-8 border-l-[4px] border-lime-400 pl-4">
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-[40px]">
          {post.title}
        </h1>
        <p className="mt-2 text-sm text-ink-3">
          {post.venue} · <span className="capitalize">{formatDateLong(post.date)}</span> ·{" "}
          {post.photoCount} fotos
        </p>
      </header>

      <div className="columns-2 gap-4 lg:columns-3 [&>*]:mb-4">
        {photos.map((image, index) => (
          <figure
            key={image.src}
            className="break-inside-avoid overflow-hidden rounded-lg bg-forest-100"
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={800}
              height={600}
              sizes="(max-width: 1024px) 50vw, 33vw"
              className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
              priority={index < 3}
            />
          </figure>
        ))}
      </div>

      {post.photoCount > photos.length && (
        <p className="mt-8 text-center text-sm text-ink-3">
          Exibindo {photos.length} de {post.photoCount} fotos.
        </p>
      )}

      <div className="mt-10">
        <AdSlot slot="flash-galeria-rodape" format="leaderboard" />
      </div>
    </div>
  );
}
