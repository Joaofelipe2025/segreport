"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { emailValido, slugDeNome } from "@/lib/auth/rules";

export interface EstadoConvite {
  status: "inicial" | "ok" | "erro";
  mensagem?: string;
}

/**
 * Convida um colunista por e-mail.
 *
 * É a única operação do sistema que usa a chave de serviço, porque criar
 * conta alheia não é permitido por nenhuma policy. A guarda de papel vem
 * ANTES de tocar nesse cliente.
 */
export async function convidarColunista(
  _estado: EstadoConvite,
  dados: FormData
): Promise<EstadoConvite> {
  await requireRole(["admin"]);

  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  const nome = String(dados.get("nome") ?? "").trim();
  const cargo = String(dados.get("cargo") ?? "").trim();

  if (!emailValido(email)) {
    return { status: "erro", mensagem: "Informe um e-mail válido." };
  }
  if (nome.length < 3) {
    return { status: "erro", mensagem: "Informe o nome completo do colunista." };
  }

  const admin = criarClienteAdmin();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: convidado, error: erroConvite } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origem}/auth/confirm`,
    });

  if (erroConvite || !convidado?.user) {
    return {
      status: "erro",
      mensagem: `Não foi possível convidar: ${erroConvite?.message ?? "erro desconhecido"}`,
    };
  }

  const userId = convidado.user.id;

  // `profiles` não tem coluna de e-mail; `full_name` é o rótulo humano.
  const { error: erroPerfil } = await admin.from("profiles").upsert({
    id: userId,
    full_name: nome,
    role: "columnist",
    invited_at: new Date().toISOString(),
  });

  if (erroPerfil) {
    return {
      status: "erro",
      mensagem: `Conta criada, mas o perfil falhou: ${erroPerfil.message}`,
    };
  }

  const { error: erroAutor } = await admin.from("authors").upsert(
    {
      profile_id: userId,
      name: nome,
      slug: slugDeNome(nome),
      email,
      role: cargo || "Colunista",
    },
    { onConflict: "profile_id" }
  );

  if (erroAutor) {
    return {
      status: "erro",
      mensagem: `Perfil criado, mas a assinatura falhou: ${erroAutor.message}`,
    };
  }

  revalidatePath("/admin/colunistas");
  return { status: "ok", mensagem: `Convite enviado para ${email}.` };
}
