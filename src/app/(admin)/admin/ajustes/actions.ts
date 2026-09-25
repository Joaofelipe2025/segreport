"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePainel } from "@/lib/auth/session";
import { slugDeNome } from "@/lib/auth/rules";

export interface EstadoAjustes {
  status: "inicial" | "salvo" | "erro";
  mensagem?: string;
}

/**
 * Edita a própria assinatura pública.
 *
 * Só a própria: o `eq("profile_id", perfil.id)` limita no código e a RLS
 * limita de novo no banco. Um admin que precise mexer na assinatura de outra
 * pessoa usa a tela de colunistas.
 */
export async function salvarAssinatura(
  _estado: EstadoAjustes,
  dados: FormData
): Promise<EstadoAjustes> {
  const perfil = await requirePainel();

  const nome = String(dados.get("name") ?? "").trim();
  const bio = String(dados.get("bio") ?? "").trim();

  if (nome.length < 2) {
    return {
      status: "erro",
      mensagem: "O nome da assinatura precisa de pelo menos duas letras.",
    };
  }
  if (!perfil.authorId) {
    return {
      status: "erro",
      mensagem:
        "Sua conta ainda não tem assinatura pública. Peça ao administrador para criar.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("authors")
    .update({ name: nome, bio: bio || null, slug: slugDeNome(nome) })
    .eq("id", perfil.authorId)
    .eq("profile_id", perfil.id);

  if (error) return { status: "erro", mensagem: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/admin/ajustes");
  return { status: "salvo", mensagem: "Assinatura atualizada." };
}
