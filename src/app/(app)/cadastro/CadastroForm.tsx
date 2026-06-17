"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "./actions";

export default function CadastroForm() {
  const [error, formAction, pending] = useActionState(signupAction, null);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-lg bg-[#FDECEA] px-4 py-2.5 text-center font-sans text-[13px] text-[#C0392B]">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="font-sans text-[13px] font-medium text-[#3D3D3A]">
          Nome completo
        </label>
        <input
          type="text" id="nome" name="nome" required autoComplete="name"
          placeholder="Seu nome completo"
          className="rounded-lg border border-[rgba(0,0,0,.08)] px-3 py-2.5 font-sans text-[14px] text-[#1A1A18] outline-none focus:border-[#0D6E4F]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-sans text-[13px] font-medium text-[#3D3D3A]">
          E-mail
        </label>
        <input
          type="email" id="email" name="email" required autoComplete="email"
          placeholder="seuemail@exemplo.com"
          className="rounded-lg border border-[rgba(0,0,0,.08)] px-3 py-2.5 font-sans text-[14px] text-[#1A1A18] outline-none focus:border-[#0D6E4F]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="font-sans text-[13px] font-medium text-[#3D3D3A]">
          Senha
        </label>
        <input
          type="password" id="senha" name="senha" required autoComplete="new-password"
          placeholder="••••••••"
          className="rounded-lg border border-[rgba(0,0,0,.08)] px-3 py-2.5 font-sans text-[14px] text-[#1A1A18] outline-none focus:border-[#0D6E4F]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmar-senha" className="font-sans text-[13px] font-medium text-[#3D3D3A]">
          Confirmar senha
        </label>
        <input
          type="password" id="confirmar-senha" name="confirmar-senha" required autoComplete="new-password"
          placeholder="••••••••"
          className="rounded-lg border border-[rgba(0,0,0,.08)] px-3 py-2.5 font-sans text-[14px] text-[#1A1A18] outline-none focus:border-[#0D6E4F]"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox" id="termos" name="termos" required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[rgba(0,0,0,.08)] accent-[#0D6E4F]"
        />
        <label htmlFor="termos" className="font-sans text-[13px] leading-snug text-[#3D3D3A]">
          Li e aceito os{" "}
          <Link href="/termos" className="font-medium text-[#0D6E4F] hover:underline">Termos de Uso</Link>
          {" "}e a{" "}
          <Link href="/privacidade" className="font-medium text-[#0D6E4F] hover:underline">Política de Privacidade</Link>
        </label>
      </div>

      <button
        type="submit" disabled={pending}
        className="w-full rounded-full bg-[#0D6E4F] px-4 py-2.5 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Criando conta…" : "Criar conta"}
      </button>

      <p className="text-center font-sans text-[13px] text-[#3D3D3A]">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium text-[#0D6E4F] hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
