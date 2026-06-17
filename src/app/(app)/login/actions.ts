"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = formData.get("email") as string;
  const senha = formData.get("senha") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return error.message.includes("Invalid login credentials")
      ? "E-mail ou senha incorretos."
      : "Erro ao entrar. Tente novamente.";
  }

  redirect("/");
}
