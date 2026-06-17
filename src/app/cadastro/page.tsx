import { Metadata } from "next";
import Link from "next/link";
import CadastroForm from "./CadastroForm";

export const metadata: Metadata = {
  title: "Criar conta | Segreport",
  description: "Crie sua conta Segreport e acompanhe o mercado segurador brasileiro.",
};

export default function CadastroPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-8">
        <Link href="/" aria-label="Segreport — página inicial"
          className="mx-auto block w-fit font-sans text-xl font-extrabold tracking-tight">
          <span className="text-[#1A1A18]">Seg</span>
          <span className="italic text-[#0D6E4F]">report</span>
        </Link>

        <h1 className="mt-6 text-center font-sans text-lg font-semibold text-[#1A1A18]">
          Criar conta
        </h1>

        <CadastroForm />
      </div>
    </main>
  );
}
