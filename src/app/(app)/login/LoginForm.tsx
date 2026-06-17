"use client";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [error, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-lg bg-[#FDECEA] px-4 py-2.5 text-center font-sans text-[13px] text-[#C0392B]">
          {error}
        </p>
      )}

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
          type="password" id="senha" name="senha" required autoComplete="current-password"
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
        type="submit" disabled={pending}
        className="w-full rounded-full bg-[#0D6E4F] px-4 py-2.5 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center font-sans text-[13px] text-[#3D3D3A]">
        Não tem uma conta?{" "}
        <Link href="/cadastro" className="font-medium text-[#0D6E4F] hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
