"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

const ESTADOS = new Set(["nova", "lida", "descartada", "virou_materia"]);

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
