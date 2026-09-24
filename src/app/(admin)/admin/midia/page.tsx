import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { requirePainel } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mídia" };

export default async function MidiaPage() {
  await requirePainel();

  return (
    <>
      <PageHeader
        titulo="Mídia"
        descricao="Biblioteca compartilhada da equipe. Toda imagem exige texto alternativo no envio."
      />
      <p className="rounded-xl border border-dashed border-hairline bg-white/60 px-6 py-14 text-center text-sm text-ink-3">
        O envio de arquivos entra no próximo plano.
      </p>
    </>
  );
}
