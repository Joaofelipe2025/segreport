"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

// Só os estados que a TELA manda (ver BotoesDaPauta.tsx: "Guardar" e
// "Descartar"). `virou_materia` gravaria a pauta como tendo virado matéria
// com `article_id` nulo — enquanto não existe o fluxo que preenche
// `article_id`, isso seria um registro que mente. `nova` também fica de
// fora: não há botão para devolver uma pauta a esse estado.
const ESTADOS = new Set(["lida", "descartada"]);

export async function mudarEstadoDaPauta(
  id: string,
  estado: string
): Promise<{ status: "salvo" | "erro"; mensagem: string }> {
  await requireRole(["admin"]);

  if (!ESTADOS.has(estado)) {
    return { status: "erro", mensagem: "Estado inválido." };
  }

  const supabase = await createClient();
  // `.select()` não é enfeite: sem ele não há como distinguir "mudou" de
  // "a RLS recusou em silêncio".
  const { data, error } = await supabase
    .from("pautas")
    .update({ estado })
    .eq("id", id)
    .select("id");

  if (error) return { status: "erro", mensagem: `Não foi possível salvar: ${error.message}` };
  if (!data?.length) return { status: "erro", mensagem: "Nada mudou — o banco recusou." };

  revalidatePath("/admin/pautas");
  return { status: "salvo", mensagem: "Pronto." };
}
