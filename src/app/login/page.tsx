import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Entrar | Segreport",
  description: "Acesse sua conta Segreport para acompanhar o mercado segurador brasileiro.",
};

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="11" fill="#fff" stroke="rgba(0,0,0,.08)" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#3D3D3A"
        fontFamily="Arial, sans-serif"
      >
        G
      </text>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-8">
        <Link
          href="/"
          aria-label="Segreport — página inicial"
          className="mx-auto block w-fit font-sans text-xl font-extrabold tracking-tight"
        >
          <span className="text-[#1A1A18]">Seg</span>
          <span className="italic text-[#0D6E4F]">report</span>
        </Link>

        <h1 className="mt-6 text-center font-sans text-lg font-semibold text-[#1A1A18]">
          Entrar
        </h1>

        <form className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-sans text-[13px] font-medium text-[#3D3D3A]">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              className="rounded-lg border border-[rgba(0,0,0,.08)] px-3 py-2.5 font-sans text-[14px] text-[#1A1A18] outline-none focus:border-[#0D6E4F]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="font-sans text-[13px] font-medium text-[#3D3D3A]">
              Senha
            </label>
            <input
              type="password"
              id="senha"
              name="senha"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-lg border border-[rgba(0,0,0,.08)] px-3 py-2.5 font-sans text-[14px] text-[#1A1A18] outline-none focus:border-[#0D6E4F]"
            />
          </div>

          <div className="flex justify-end">
            <Link href="#" className="font-sans text-sm text-[#0D6E4F] hover:underline">
              Esqueci minha senha
            </Link>
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-[#0D6E4F] px-4 py-2.5 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Entrar
          </button>

          <p className="text-center font-sans text-[13px] text-[#3D3D3A]">
            Não tem uma conta?{" "}
            <Link href="/cadastro" className="font-medium text-[#0D6E4F] hover:underline">
              Criar conta
            </Link>
          </p>
        </form>

        <div className="my-6 flex items-center gap-3" role="presentation">
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
          <span className="font-sans text-[12px] text-[#76766F]">ou</span>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(0,0,0,.08)] px-4 py-2.5 font-sans text-[14px] font-medium text-[#1A1A18] transition-colors hover:border-[#0D6E4F]"
        >
          <GoogleIcon />
          Continuar com Google
        </button>
      </div>
    </main>
  );
}
