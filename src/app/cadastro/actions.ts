"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signupAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const senha = formData.get("senha") as string;
  const confirmar = formData.get("confirmar-senha") as string;

  if (senha !== confirmar) return "As senhas não coincidem.";
  if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { full_name: nome } },
  });

  if (error) {
    if (error.message.includes("already registered")) return "Este e-mail já está cadastrado.";
    return "Erro ao criar conta. Tente novamente.";
  }

  redirect("/login?verificar=1");
}
