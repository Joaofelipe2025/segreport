import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contato" };

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="border-l-[4px] border-lime-400 pl-4 text-3xl font-bold tracking-[-0.025em] text-ink sm:text-[40px]">
          Contato
        </h1>
        <p className="mt-3 pl-4 text-base leading-relaxed text-ink-3">
          Pauta, correção, proposta comercial ou divulgação de evento — escreva
          e retornamos em até um dia útil.
        </p>

        <form className="mt-9 space-y-4 rounded-2xl border border-hairline bg-white p-7">
          <div>
            <label htmlFor="contato-nome" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-2">
              Nome
            </label>
            <input id="contato-nome" name="nome" type="text"
              className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-sm outline-none focus:border-forest-500 focus:bg-white" />
          </div>
          <div>
            <label htmlFor="contato-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-2">
              E-mail
            </label>
            <input id="contato-email" name="email" type="email"
              className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-sm outline-none focus:border-forest-500 focus:bg-white" />
          </div>
          <div>
            <label htmlFor="contato-msg" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-2">
              Mensagem
            </label>
            <textarea id="contato-msg" name="mensagem" rows={5}
              className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-sm outline-none focus:border-forest-500 focus:bg-white" />
          </div>
          <button type="button"
            className="w-full rounded-lg bg-forest-800 py-3.5 text-xs font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-forest-700">
            Enviar mensagem
          </button>
        </form>

        <p className="mt-5 rounded-lg border border-dashed border-hairline bg-white/60 px-4 py-3 text-center text-xs text-ink-3">
          O envio ainda não está ligado neste preview.
        </p>
      </div>
    </div>
  );
}
