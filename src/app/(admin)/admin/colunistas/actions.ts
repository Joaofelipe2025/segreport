"use server";

import { origemDoSite } from "@/lib/painel/origem";
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
  const origem = origemDoSite();

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

  // Reconvidar alguém é comum — o link expira e a pessoa pede outro. Se essa
  // pessoa já for admin, gravar 'columnist' a rebaixaria em silêncio, e a
  // chave de serviço não é barrada por nada. Só promovemos quem ainda é
  // leitor.
  //
  // A leitura falha FECHADA. Descartar o erro desligava a guarda exatamente
  // no caso que ela descreve: `perfilAtual` vinha nulo, o `if` não entrava, e
  // o upsert com chave de serviço rebaixava um admin sem que nada aparecesse.
  const { data: perfilAtual, error: erroPapel } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (erroPapel) {
    return {
      status: "erro",
      mensagem: `Não deu para conferir o papel atual de ${email} (${erroPapel.message}). Nada foi alterado — gravar sem essa checagem poderia rebaixar um administrador.`,
    };
  }

  if (perfilAtual && perfilAtual.role !== "reader" && perfilAtual.role !== "columnist") {
    return {
      status: "erro",
      mensagem: `${email} já tem uma conta de ${perfilAtual.role}. O link de acesso foi reenviado, e o papel foi mantido.`,
    };
  }

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

  // O slug precisa ser único. Dois colunistas homônimos, ou um nome que já
  // existia como assinatura sem conta, colidiriam — e a pessoa entraria no
  // painel sem conseguir criar matéria nenhuma, porque a policy de inserção
  // exige author_id = current_author_id().
  const slugBase = slugDeNome(nome);
  let slug = slugBase;

  const { data: ocupado } = await admin
    .from("authors")
    .select("id, profile_id")
    .eq("slug", slugBase)
    .maybeSingle();

  if (ocupado && ocupado.profile_id !== userId) {
    slug = `${slugBase}-${userId.slice(0, 6)}`;
  }

  const { error: erroAutor } = await admin.from("authors").upsert(
    {
      profile_id: userId,
      name: nome,
      slug,
      email,
      role: cargo || "Colunista",
    },
    { onConflict: "profile_id" }
  );

  if (erroAutor) {
    // A conta e o perfil já existem neste ponto. Sem assinatura pública o
    // colunista entra e não consegue publicar, então a mensagem precisa dizer
    // exatamente o que aconteceu — não "erro ao convidar".
    return {
      status: "erro",
      mensagem:
        `A conta de ${email} foi criada, mas a assinatura pública falhou: ${erroAutor.message}. ` +
        `Crie o autor manualmente e vincule ao perfil antes de o colunista escrever.`,
    };
  }

  revalidatePath("/admin/colunistas");
  return { status: "ok", mensagem: `Convite enviado para ${email}.` };
}
