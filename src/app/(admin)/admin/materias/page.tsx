import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { requirePainel } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Matérias" };

export default async function MateriasPage() {
  const perfil = await requirePainel();

  return (
    <>
      <PageHeader
        titulo="Matérias"
        descricao={
          perfil.role === "columnist"
            ? "Suas colunas. Escreva, envie para revisão e acompanhe o status."
            : "Todas as matérias do portal, de qualquer autor."
        }
      />
      <p className="rounded-xl border border-dashed border-hairline bg-white/60 px-6 py-14 text-center text-sm text-ink-3">
        A listagem e o editor entram no próximo plano.
      </p>
    </>
  );
}
