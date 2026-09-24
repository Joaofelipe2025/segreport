import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { destinoAposLogin } from "@/lib/auth/rules";

/**
 * Recebe o clique no link do e-mail e troca o código por uma sessão.
 *
 * O destino depende do papel: quem edita vai para o painel, leitor vai para o
 * Hub. `destinoAposLogin` falha fechada — papel desconhecido nunca vira acesso
 * administrativo.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type) redirect("/login?motivo=link-invalido");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });
  if (error) redirect("/login?motivo=link-expirado");

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?motivo=sessao");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  redirect(destinoAposLogin(profile?.role));
}
