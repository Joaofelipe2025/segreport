import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import EditorDeMateria, { type MateriaParaEditar } from "./EditorDeMateria";

export const metadata: Metadata = { title: "Editar matéria" };

export default async function EditarMateriaPage(props: PageProps<"/admin/materias/[id]">) {
  const { id } = await props.params;
  const perfil = await requirePainel();
  const supabase = await createClient();

  // A RLS decide o que volta: colunista só alcança as próprias, e só em
  // rascunho ou revisão. Uma matéria alheia simplesmente não aparece.
  const { data: materia } = await supabase
    .from("articles")
    .select(
      "id, slug, title, standfirst, status, category_id, seo_title, seo_description, content_json, updated_at, is_premium"
    )
    .eq("id", id)
    .maybeSingle();

  if (!materia) notFound();

  const { data: categorias } = await supabase
    .from("categories")
    .select("id, label")
    .order("label");

  return (
    <>
      <Link
        href="/admin/materias"
        className="mb-4 inline-block text-xs font-medium text-ink-3 transition-colors hover:text-forest-700"
      >
        ← Matérias
      </Link>

      <EditorDeMateria
        materia={materia as unknown as MateriaParaEditar}
        categorias={categorias ?? []}
        papel={perfil.role}
      />
    </>
  );
}
