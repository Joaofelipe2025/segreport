import type { Metadata } from "next";
import Link from "next/link";
import { mensagemDeMotivo } from "@/lib/painel/motivos";
import Formulario from "./Formulario";

export const metadata: Metadata = {
  title: "Entrar — Redação SegReport",
  robots: { index: false, follow: false },
};

/**
 * Porta da redação.
 *
 * Fica fora de `(portal)` e de `(admin)` de propósito: nada de cabeçalho,
 * rodapé ou chamada de assinatura, e nenhum `requirePainel()` que criaria
 * laço de redirecionamento. Fundo escuro porque isto é ferramenta de
 * trabalho, não publicação — quem chega aqui já sabe o que veio fazer.
 */
export default async function EntrarNaRedacao(props: PageProps<"/painel/entrar">) {
  const params = await props.searchParams;
  const aviso = mensagemDeMotivo(params.motivo);

  return (
    <main className="flex min-h-screen items-center justify-center bg-forest-900 px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lime-400">
          SegReport
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.02em] text-white">
          Redação
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-forest-300">
          Acesso ao painel editorial. O link chega por e-mail e vale uma vez.
        </p>

        {aviso && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-forest-600 bg-forest-800 px-4 py-3 text-[13px] leading-relaxed text-forest-200"
          >
            {aviso}
          </p>
        )}

        <Formulario />

        <p className="mt-8 border-t border-forest-700 pt-5 text-[12px] leading-relaxed text-forest-400">
          Procurando o Hub ou sua assinatura?{" "}
          <Link href="/login" className="text-forest-200 underline underline-offset-2">
            Entrar como leitor
          </Link>
        </p>
      </div>
    </main>
  );
}
