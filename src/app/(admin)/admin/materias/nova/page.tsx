import type { Metadata } from "next";
import { LinkGuardado } from "@/components/admin/GuardaDeSaida";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { exigir } from "@/lib/painel/consulta";
import { documentoVazio } from "@/lib/editor/document";
import EditorDeMateria from "../[id]/EditorDeMateria";

export const metadata: Metadata = { title: "Nova matéria" };

/**
 * Tela em branco, sem linha no banco.
 *
 * A versão anterior era um botão que dava `insert` na hora e redirecionava
 * para o editor. Parece prático e não é: se o editor falha, sobra uma matéria
 * fantasma; se a pessoa desiste, sobra igual. Cinco delas se acumularam
 * assim. Agora só existe matéria quando existe título.
 */
export default async function NovaMateriaPage() {
  const perfil = await requirePainel();
  const supabase = await createClient();

  const categorias = exigir(
    await supabase.from("categories").select("id, label").order("label"),
    "as categorias"
  );

  return (
    <>
      <LinkGuardado
        href="/admin/materias"
        className="mb-4 inline-block text-xs font-medium text-ink-3 transition-colors hover:text-forest-700"
      >
        ← Matérias
      </LinkGuardado>

      {!perfil.authorId && (
        <p className="mb-5 max-w-xl rounded-lg border border-[#e8dca8] bg-[#fdfaee] px-4 py-3 text-sm leading-relaxed text-[#7d6612]">
          Sua conta ainda não tem assinatura pública, então não será possível
          salvar: toda matéria precisa de um autor. Peça ao administrador para
          criar o autor e vincular ao seu perfil.
        </p>
      )}

      <EditorDeMateria
        materia={{
          id: null,
          slug: "",
          title: "",
          standfirst: null,
          status: "draft",
          category_id: null,
          seo_title: null,
          seo_description: null,
          cover_url: null,
          excerpt: null,
          updated_at: "",
          is_premium: false,
        }}
        corpo={documentoVazio()}
        categorias={categorias}
        papel={perfil.role}
      />
    </>
  );
}
