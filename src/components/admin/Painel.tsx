import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Peças de composição do painel.
 *
 * Existem para que as telas parem de reinventar cartão, seção e lista vazia
 * com classes ligeiramente diferentes a cada vez — que era de onde vinha a
 * sensação de coisa remendada. Aqui a hierarquia é decidida uma vez: título
 * de seção sempre no mesmo tamanho e peso, cartão sempre com a mesma borda e
 * raio, e o vazio sempre com uma frase que diz o que fazer em seguida.
 */

export function Secao({
  titulo,
  contagem,
  aoLado,
  children,
}: {
  titulo: string;
  contagem?: number;
  aoLado?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-ink">
          {titulo}
          {contagem !== undefined && (
            <span className="ml-2 font-normal tabular-nums text-ink-4">{contagem}</span>
          )}
        </h2>
        {aoLado}
      </div>
      {children}
    </section>
  );
}

export function Cartao({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-hairline bg-white ${className}`}>{children}</div>
  );
}

/**
 * Aviso que pede ação.
 *
 * Três tons, e a escolha não é decorativa: `atencao` é trabalho parado
 * esperando alguém, `alerta` é coisa quebrada que não se resolve sozinha, e
 * `calmo` é informação. Lime não entra em nenhum: sobre fundo claro o
 * contraste dele fica em 1,3:1, e texto assim não se lê.
 */
export function Aviso({
  tom = "atencao",
  titulo,
  children,
}: {
  tom?: "atencao" | "alerta" | "calmo";
  titulo: string;
  children?: ReactNode;
}) {
  const cores = {
    atencao: "border-[#e8dca8] bg-[#fdfaee] text-[#7d6612]",
    alerta: "border-[#f0cdcd] bg-[#fdf3f3] text-[#a5252a]",
    calmo: "border-hairline bg-paper text-ink-2",
  }[tom];

  return (
    <div className={`mb-6 rounded-xl border p-5 ${cores}`}>
      <h2 className="text-sm font-semibold">{titulo}</h2>
      {children}
    </div>
  );
}

/** Número grande com rótulo, clicável quando leva a algum lugar. */
export function Numero({
  valor,
  rotulo,
  href,
  destaque,
}: {
  valor: number | string;
  rotulo: string;
  href?: string;
  destaque?: string;
}) {
  const conteudo = (
    <>
      <p className="text-2xl font-semibold tabular-nums text-ink">{valor}</p>
      <p
        className={`mt-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          destaque ?? "text-ink-3"
        }`}
      >
        {rotulo}
      </p>
    </>
  );

  const classe = "block rounded-xl border border-hairline bg-white p-4 transition-colors";
  return href ? (
    <Link href={href} className={`${classe} hover:border-forest-500`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

/** Estado vazio que diz o que fazer, não só que está vazio. */
export function Vazio({ children }: { children: ReactNode }) {
  return (
    <Cartao className="px-5 py-10 text-center text-sm leading-relaxed text-ink-3">
      {children}
    </Cartao>
  );
}

/** Linha de matéria, do mesmo jeito em toda tela do painel. */
export function LinhaDeMateria({
  href,
  titulo,
  direita,
  etiqueta,
}: {
  href: string;
  titulo: string;
  direita?: ReactNode;
  etiqueta?: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-paper"
      >
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{titulo}</span>
        {etiqueta}
        {direita && <span className="shrink-0 text-[11px] text-ink-3">{direita}</span>}
      </Link>
    </li>
  );
}
