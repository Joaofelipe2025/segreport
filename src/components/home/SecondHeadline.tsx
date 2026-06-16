export default function SecondHeadline() {
  return (
    <article
      aria-label="Segunda manchete"
      className="my-8 rounded-r-xl border-l-4 border-[#0D6E4F] bg-[#1A1A18] p-8"
    >
      <span className="inline-block rounded-full bg-[#12956A]/15 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-[#12956A]">
        🚨 Breaking
      </span>
      <h2 className="mt-4 font-sans text-[32px] font-extrabold leading-tight text-white">
        Bradesco Seguros anuncia integração total com IA generativa até o
        fim do ano
      </h2>
      <p className="mt-3 max-w-2xl font-sans text-base font-light text-white/70">
        Movimento deve acelerar automação de sinistros e atendimento,
        colocando pressão competitiva sobre concorrentes de médio porte.
      </p>
      <a
        href="#"
        className="mt-5 inline-flex items-center gap-1 font-sans text-sm font-semibold text-[#12956A] hover:underline"
      >
        Ler mais →
      </a>
    </article>
  );
}
