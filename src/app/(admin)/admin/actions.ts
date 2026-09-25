"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export interface EstadoDaLimpeza {
  status: "salvo" | "erro";
  mensagem: string;
}

/**
 * Apaga os rascunhos que nunca receberam texto.
 *
 * Os filtros são o contrato inteiro desta ação, e cada um está aqui por um
 * motivo:
 *
 *   status = draft        nunca toca em nada que esteja no ar
 *   reading_time is null  só é gravado no salvamento; nulo = nada escrito
 *
 * A checagem repete o que a interface já mostrou, porque a interface não é
 * barreira: uma chamada direta à Server Action não passa por ela. O `select`
 * no fim não é enfeite — sem ele não há como distinguir "apagou" de "a RLS
 * recusou em silêncio".
 */
export async function descartarRascunhosVazios(): Promise<EstadoDaLimpeza> {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .delete()
    .eq("status", "draft")
    .is("reading_time", null)
    .select("id");

  if (error) {
    return { status: "erro", mensagem: `Não foi possível apagar: ${error.message}` };
  }

  const quantos = data?.length ?? 0;
  revalidatePath("/admin");
  revalidatePath("/admin/materias");

  return {
    status: "salvo",
    mensagem:
      quantos === 0
        ? "Nada foi apagado — não havia rascunho vazio, ou o banco recusou."
        : `${quantos} ${quantos === 1 ? "rascunho apagado" : "rascunhos apagados"}.`,
  };
}
