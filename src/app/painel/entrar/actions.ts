"use server";

import { createClient } from "@/lib/supabase/server";
import { emailValido } from "@/lib/auth/rules";

export interface EstadoDaPorta {
  status: "inicial" | "enviado" | "erro";
  mensagem?: string;
}

/**
 * Mesma resposta no sucesso e na falha — a porta da redação é justamente
 * onde essa disciplina mais importa. Dizer "este e-mail não é da redação"
 * entregaria a lista de quem escreve no veículo a quem sondasse endereços.
 */
const RESPOSTA_NEUTRA: EstadoDaPorta = {
  status: "enviado",
  mensagem: "Se este e-mail for da redação, o link chegará em instantes.",
};

export async function enviarLinkDaRedacao(
  _estado: EstadoDaPorta,
  dados: FormData
): Promise<EstadoDaPorta> {
  const email = String(dados.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!emailValido(email)) {
    return { status: "erro", mensagem: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origem}/auth/confirm`,
      // Convite é o único caminho de entrada. Sem isto, pedir um link cria
      // conta, e a porta da redação passa a ser porta aberta.
      shouldCreateUser: false,
    },
  });

  return RESPOSTA_NEUTRA;
}
