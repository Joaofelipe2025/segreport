"use server";
import { createClient } from "@/lib/supabase/server";

type NewsletterState = { ok: boolean; message: string } | null;

export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = formData.get("email") as string;
  const source = (formData.get("source") as "footer" | "sidebar") ?? "footer";

  if (!email || !email.includes("@")) {
    return { ok: false, message: "E-mail inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, source, status: "active" });

  // 23505 = unique_violation (e-mail já cadastrado) — tratar como sucesso
  if (error && error.code !== "23505") {
    return { ok: false, message: "Erro ao assinar. Tente novamente." };
  }

  return { ok: true, message: "Inscrito com sucesso!" };
}
