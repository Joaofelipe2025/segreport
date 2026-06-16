export default function Hero() {
  return (
    <article
      aria-label="Manchete principal"
      className="relative h-[280px] w-full overflow-hidden md:h-[480px]"
    >
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #062918, #12956A)" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex flex-col justify-end px-5 pb-8 md:px-8 md:pb-12">
        <div className="mx-auto w-full max-w-[1240px]">
          <span className="mb-4 inline-block rounded-full bg-[#0D6E4F] px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-white">
            ⚡ Regulação
          </span>
          <h1 className="max-w-3xl font-sans text-[28px] font-extrabold leading-[1.1] text-white md:text-[48px]">
            SUSEP eleva exigência de capital para resseguradoras locais a
            partir de 2026
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-[18px] font-light text-white/80">
            Nova circular estabelece cronograma de adequação até dezembro e
            pode acelerar a consolidação entre players médios do setor de
            resseguros no Brasil.
          </p>
          <div className="mt-4 flex items-center gap-3 font-mono text-[12px] text-white/60">
            <time dateTime="2026-06-16T08:30:00-03:00">Há 2h</time>
            <span aria-hidden="true">·</span>
            <span>6 min de leitura</span>
          </div>
        </div>
      </div>
    </article>
  );
}
