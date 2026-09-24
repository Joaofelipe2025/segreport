import Link from "next/link";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const motivo = typeof params.motivo === "string" ? params.motivo : undefined;

  return (
    <div className="mx-auto flex max-w-[1400px] justify-center px-4 py-12 lg:px-8 lg:py-20">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-hairline bg-white p-7 sm:p-8">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink">
            Entrar no SegReport
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-3">
            Acesse o Hub Inteligência e suas preferências.
          </p>

          <div className="mt-7">
            <LoginForm motivo={motivo} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-3">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-forest-700 hover:underline">
            Criar conta gratuita
          </Link>
        </p>

        {/* Quem escreve entra por outra porta. O link fica aqui porque
            /auth/confirm manda link vencido para cá sem saber quem é a
            pessoa — sem esta saída, o jornalista fica num beco. */}
        <p className="mt-3 text-center text-xs text-ink-4">
          Você escreve para o SegReport?{" "}
          <Link href="/painel/entrar" className="text-forest-700 hover:underline">
            Entrar na redação
          </Link>
        </p>
      </div>
    </div>
  );
}
