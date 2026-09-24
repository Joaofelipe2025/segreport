import type { Metadata } from "next";
import Sidebar from "@/components/admin/Sidebar";
import { requirePainel } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel SegReport" },
  // O painel nunca deve ser indexado.
  robots: { index: false, follow: false },
};

// Todo o painel depende de quem pede. Nada aqui pode ser pré-renderizado:
// uma página estática serviria o painel de um usuário para outro.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await requirePainel();

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <Sidebar papel={perfil.role} email={perfil.email} />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
