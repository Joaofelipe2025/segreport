"use server";

import { createClient } from "@/lib/supabase/server";
import { emailValido } from "@/lib/auth/rules";

export interface EstadoLogin {
  status: "inicial" | "enviado" | "erro";
  mensagem?: string;
}

/**
 * Mesma resposta no sucesso e na falha.
 *
 * Dizer "este e-mail não tem acesso" entregaria a um atacante a lista de quem
 * tem conta no veículo. A única diferença de tratamento é o e-mail malformado,
 * que é erro de digitação e não revela nada.
 */
const RESPOSTA_NEUTRA: EstadoLogin = {
  status: "enviado",
  mensagem: "Se este e-mail tiver acesso, o link chegará em instantes.",
};

export async function enviarLinkMagico(
  _estado: EstadoLogin,
  dados: FormData
): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "").trim().toLowerCase();

  if (!emailValido(email)) {
    return { status: "erro", mensagem: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origem}/auth/confirm`,
      // Só entra quem já foi convidado. Sem isto, qualquer pessoa cria conta
      // pedindo um link, e o painel passa a ter porta aberta.
      shouldCreateUser: false,
    },
  });

  return RESPOSTA_NEUTRA;
}
