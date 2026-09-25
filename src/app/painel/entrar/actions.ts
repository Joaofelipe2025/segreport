"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_DA_PORTA, VALIDADE_DA_PORTA } from "@/lib/painel/porta";
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

  // Marca de onde a pessoa veio, para /auth/confirm saber a qual porta
  // devolvê-la se o link vencer. Ver src/lib/painel/porta.ts.
  const biscoitos = await cookies();
  biscoitos.set(COOKIE_DA_PORTA, "redacao", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VALIDADE_DA_PORTA,
  });

  const supabase = await createClient();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origem}/auth/confirm`,
      // Convite é o único caminho de entrada. Sem isto, pedir um link cria
      // conta, e a porta da redação passa a ser porta aberta.
      shouldCreateUser: false,
    },
  });

  // A resposta é neutra para quem pede, mas o erro não pode sumir também do
  // servidor: SMTP fora do ar e estouro de cota ficariam invisíveis dos dois
  // lados, e foi exatamente esse o problema que travou o primeiro acesso.
  if (error) console.error("[painel/entrar] signInWithOtp:", error.message);

  return RESPOSTA_NEUTRA;
}
