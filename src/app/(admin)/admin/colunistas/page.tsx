import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import FormularioConvite from "./FormularioConvite";

export const metadata: Metadata = { title: "Colunistas" };

export default async function ColunistasPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: colunistas } = await supabase
    .from("authors")
    .select("id, name, slug, role, email, profile_id")
    .not("profile_id", "is", null)
    .order("name");

  return (
    <>
      <PageHeader
        titulo="Colunistas"
        descricao="Convide por e-mail. O colunista escreve e envia para revisão; publicar é só seu."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-xl border border-hairline bg-white">
          {colunistas && colunistas.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {colunistas.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {c.role ?? "Colunista"}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                  {c.slug && (
                    <p className="mt-1 font-mono text-[11px] text-ink-4">
                      /colunistas/{c.slug}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-14 text-center text-sm text-ink-3">
              Nenhum colunista convidado ainda.
            </p>
          )}
        </div>

        <FormularioConvite />
      </div>
    </>
  );
}
