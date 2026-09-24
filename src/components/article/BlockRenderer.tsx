import Image from "next/image";
import Link from "next/link";
import type { NoDeBloco } from "@/lib/editor/document";
import { MARCADOR_RESTRITO } from "@/lib/editor/document";
import { LockIcon } from "@/components/ui/Badge";
import { PRO_BENEFITS } from "@/lib/tier";

/**
 * Renderiza o documento de blocos da matéria.
 *
 * Mapeia tipo de bloco para componente React. Bloco de tipo DESCONHECIDO é
 * ignorado, nunca derruba a página — é o que permite publicar um bloco novo
 * antes que todo o código de renderização o conheça, e manter matéria antiga
 * funcionando depois de uma remoção.
 */

export default function BlockRenderer({ doc }: { doc: NoDeBloco | null | undefined }) {
  if (!doc?.content) return null;
  return (
    <>
      {doc.content.map((bloco, i) => (
        <Bloco key={i} no={bloco} />
      ))}
    </>
  );
}

function Bloco({ no }: { no: NoDeBloco }) {
  switch (no.type) {
    case "paragraph":
      return (
        <p className="mb-5 text-[17px] leading-[1.75] text-ink-2">
          <Inline nos={no.content} />
        </p>
      );

    case "heading": {
      const nivel = Number(no.attrs?.level ?? 2);
      const classe =
        nivel <= 2
          ? "mt-9 mb-3 text-2xl font-bold leading-snug tracking-[-0.02em] text-ink"
          : "mt-7 mb-2.5 text-lg font-semibold leading-snug text-ink";
      const Tag = (nivel <= 2 ? "h2" : "h3") as "h2" | "h3";
      return (
        <Tag className={classe}>
          <Inline nos={no.content} />
        </Tag>
      );
    }

    case "blockquote":
      return (
        <blockquote className="my-7 border-l-[3px] border-lime-400 pl-5 text-[19px] leading-relaxed text-ink">
          {(no.content ?? []).map((filho, i) => (
            <Bloco key={i} no={filho} />
          ))}
        </blockquote>
      );

    case "bulletList":
    case "orderedList": {
      const Tag = no.type === "bulletList" ? "ul" : "ol";
      return (
        <Tag
          className={`mb-5 space-y-2 pl-5 text-[17px] leading-[1.7] text-ink-2 ${
            no.type === "bulletList" ? "list-disc" : "list-decimal"
          }`}
        >
          {(no.content ?? []).map((item, i) => (
            <li key={i}>
              {(item.content ?? []).map((filho, j) => (
                <Inline key={j} nos={filho.content} />
              ))}
            </li>
          ))}
        </Tag>
      );
    }

    case "image": {
      const src = String(no.attrs?.src ?? "");
      if (!src) return null;
      const legenda = String(no.attrs?.legenda ?? "");
      const credito = String(no.attrs?.credito ?? "");
      return (
        <figure className="my-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-forest-100">
            <Image
              src={src}
              alt={String(no.attrs?.alt ?? "")}
              fill
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-cover"
            />
          </div>
          {(legenda || credito) && (
            <figcaption className="mt-2 text-xs leading-relaxed text-ink-4">
              {legenda}
              {legenda && credito && " · "}
              {credito}
            </figcaption>
          )}
        </figure>
      );
    }

    case "horizontalRule":
      return <hr className="my-9 border-hairline" />;

    case "codeBlock":
      return (
        <pre className="mb-5 overflow-x-auto rounded-lg bg-forest-900 p-4 font-mono text-[13px] leading-relaxed text-forest-100">
          <code>
            <Inline nos={no.content} />
          </code>
        </pre>
      );

    // ---- Blocos próprios do SegReport ------------------------------------

    case "indicatorChart":
      return <IndicadorEmbutido chave={String(no.attrs?.indicatorKey ?? "")} />;

    case "proBox":
      // Só chega aqui quem TEM acesso: para os demais, a camada de dados já
      // trocou este nó pelo marcador antes de servir.
      return (
        <div className="my-8 rounded-xl border border-lime-400/40 bg-forest-100/60 p-5 sm:p-6">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-700">
            <LockIcon className="h-3 w-3" />
            Análise exclusiva
          </p>
          {(no.content ?? []).map((filho, i) => (
            <Bloco key={i} no={filho} />
          ))}
        </div>
      );

    case MARCADOR_RESTRITO:
      return <ChamadaDeAssinatura />;

    case "relatedArticles":
      return <Relacionadas slugs={(no.attrs?.slugs as string[]) ?? []} />;

    default:
      // Bloco que este código ainda não conhece. Some em silêncio em vez de
      // quebrar a matéria inteira.
      return null;
  }
}

/** Texto com marcas: negrito, itálico, link, código. */
function Inline({ nos }: { nos?: NoDeBloco[] }) {
  if (!nos) return null;
  return (
    <>
      {nos.map((no, i) => {
        if (no.type === "hardBreak") return <br key={i} />;
        if (!no.text) return null;

        let conteudo: React.ReactNode = no.text;
        for (const marca of no.marks ?? []) {
          switch (marca.type) {
            case "bold":
              conteudo = <strong className="font-semibold text-ink">{conteudo}</strong>;
              break;
            case "italic":
              conteudo = <em>{conteudo}</em>;
              break;
            case "code":
              conteudo = (
                <code className="rounded bg-forest-100 px-1.5 py-0.5 font-mono text-[0.9em]">
                  {conteudo}
                </code>
              );
              break;
            case "link": {
              const href = String(marca.attrs?.href ?? "");
              const externo = /^https?:\/\//.test(href);
              conteudo = (
                <a
                  href={href}
                  className="text-forest-700 underline decoration-lime-400 decoration-2 underline-offset-2 hover:text-forest-800"
                  {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {conteudo}
                </a>
              );
              break;
            }
          }
        }
        return <span key={i}>{conteudo}</span>;
      })}
    </>
  );
}

/**
 * Gráfico de indicador embutido.
 *
 * Carrega o dado no momento da renderização, não no da escrita: matéria
 * antiga mostra número corrente, e corrigir o histórico corrige o texto
 * publicado junto.
 */
async function IndicadorEmbutido({ chave }: { chave: string }) {
  if (!chave) return null;

  const { getCurrentTier, getIndicators } = await import("@/lib/data");
  const { formatIndicator, formatDelta, trendOf } = await import("@/lib/format");

  const tier = await getCurrentTier();
  const todos = await getIndicators(tier);
  const alvo = todos.find((i) => i.definition.key === chave);

  if (!alvo) return null;

  if (alvo.locked) {
    return (
      <div className="my-8 rounded-xl border border-dashed border-lime-400/40 bg-forest-800 p-5 text-white">
        <p className="text-sm font-semibold text-forest-200">{alvo.definition.label}</p>
        <Link
          href="/premium"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-lime-400 hover:text-lime-300"
        >
          <LockIcon className="h-3 w-3" />
          Indicador exclusivo para assinantes
        </Link>
      </div>
    );
  }

  const tendencia = trendOf(alvo.deltaPp);

  return (
    <figure className="my-8 rounded-xl bg-gradient-to-br from-forest-800 to-forest-900 p-5 text-white ring-1 ring-white/8 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-forest-300">
        {alvo.definition.label} · {alvo.definition.window}
      </p>
      <p className="mt-2 font-mono text-[38px] font-bold leading-none tracking-[-0.035em] text-lime-400 tabular-nums">
        {formatIndicator(alvo.value, alvo.definition.unit)}
      </p>
      <p className="mt-2.5 flex items-center gap-2 text-xs">
        <span
          className={
            tendencia === "up" ? "text-up" : tendencia === "down" ? "text-down" : "text-forest-300"
          }
        >
          {formatDelta(alvo.deltaPp)}
        </span>
        <span className="text-forest-500">vs. período anterior</span>
      </p>
      <figcaption className="mt-3 text-[10px] text-forest-500">
        Fonte: {alvo.definition.source}
      </figcaption>
    </figure>
  );
}

/** Substitui o trecho restrito para quem não tem acesso. */
function ChamadaDeAssinatura() {
  return (
    <section className="my-8 rounded-xl bg-gradient-to-br from-forest-800 to-forest-900 p-6 text-white ring-1 ring-lime-400/25 sm:p-7">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-400">
        <LockIcon className="h-3 w-3" />
        Continua para assinantes
      </p>
      <h2 className="mt-2.5 text-xl font-bold leading-snug">
        Esta análise segue no Hub Inteligência
      </h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {PRO_BENEFITS.map((b) => (
          <li key={b} className="flex gap-2 text-[13px] text-forest-200">
            <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="m3 8.5 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {b}
          </li>
        ))}
      </ul>
      <Link
        href="/premium"
        className="mt-5 inline-block rounded-full bg-lime-400 px-6 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-forest-800 transition-colors hover:bg-lime-500"
      >
        Assinar PRO
      </Link>
    </section>
  );
}

async function Relacionadas({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;

  const { getArticle } = await import("@/lib/data");
  const materias = (await Promise.all(slugs.map((s) => getArticle(s)))).filter(Boolean);

  if (materias.length === 0) return null;

  return (
    <aside className="my-8 rounded-xl border border-hairline bg-white p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
        Leia também
      </p>
      <ul className="space-y-2.5">
        {materias.map((m) => (
          <li key={m!.slug}>
            <Link
              href={`/noticias/${m!.slug}`}
              className="text-[15px] font-semibold leading-snug text-ink hover:text-forest-700"
            >
              {m!.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
