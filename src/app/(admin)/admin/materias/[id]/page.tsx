import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LinkGuardado } from "@/components/admin/GuardaDeSaida";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import EditorDeMateria, { type MateriaParaEditar } from "./EditorDeMateria";
import type { DocumentoBlocos } from "@/lib/editor/document";

export const metadata: Metadata = { title: "Editar matéria" };

export default async function EditarMateriaPage(props: PageProps<"/admin/materias/[id]">) {
  const { id } = await props.params;
  const perfil = await requirePainel();
  const supabase = await createClient();

  // A RLS decide o que volta: colunista só alcança as próprias, e só em
  // rascunho ou revisão. Uma matéria alheia simplesmente não aparece.
  //
  // O corpo NÃO vem daqui. `content_json` foi revogada de `authenticated`
  // para fechar o paywall, e o admin também é `authenticated`: pedir a coluna
  // nesta consulta derruba a consulta inteira com 42501.
  const { data: materia, error: erroMateria } = await supabase
    .from("articles")
    .select(
      "id, slug, title, standfirst, status, category_id, seo_title, seo_description, updated_at, is_premium"
    )
    .eq("id", id)
    .maybeSingle();

  // Falha de consulta não é matéria inexistente. Tratar as duas como 404 foi
  // exatamente o que escondeu este defeito: o editor respondia "não existe"
  // quando o problema era permissão.
  if (erroMateria) return <NaoAbriu motivo={erroMateria.message} />;
  if (!materia) notFound();

  const { data: corpo, error: erroCorpo } = await supabase.rpc("article_body_for_edit", {
    p_id: id,
  });

  // Nulo aqui significa "sem direito de editar", nunca "matéria vazia". Abrir
  // o editor com documento em branco faria o próximo Salvar apagar o texto de
  // quem escreveu — por isso a recusa é explícita.
  if (erroCorpo || corpo === null) {
    return <NaoAbriu motivo={erroCorpo?.message ?? "Você não tem permissão para editar esta matéria."} />;
  }

  const { data: categorias } = await supabase
    .from("categories")
    .select("id, label")
    .order("label");

  return (
    <>
      <LinkGuardado
        href="/admin/materias"
        className="mb-4 inline-block text-xs font-medium text-ink-3 transition-colors hover:text-forest-700"
      >
        ← Matérias
      </LinkGuardado>

      <EditorDeMateria
        materia={materia as unknown as MateriaParaEditar}
        corpo={corpo as unknown as DocumentoBlocos}
        categorias={categorias ?? []}
        papel={perfil.role}
      />
    </>
  );
}

/**
 * Recusa explícita, em vez de editor vazio.
 *
 * Um editor que abre em branco convida a salvar por cima. Preferimos dizer o
 * que houve e não oferecer o botão.
 */
function NaoAbriu({ motivo }: { motivo: string }) {
  return (
    <div className="max-w-xl rounded-xl border border-hairline bg-white p-6">
      <h1 className="text-lg font-semibold text-ink">Não foi possível abrir esta matéria</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-3">
        O texto não foi carregado, então o editor não abre — assim não há risco de salvar
        por cima do que já estava escrito.
      </p>
      <p className="mt-3 rounded-lg bg-paper px-3 py-2 font-mono text-[12px] text-ink-3">
        {motivo}
      </p>
      <Link
        href="/admin/materias"
        className="mt-4 inline-block text-xs font-medium text-forest-700 hover:underline"
      >
        ← Voltar para as matérias
      </Link>
    </div>
  );
}
