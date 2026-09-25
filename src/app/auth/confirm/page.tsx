import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { destinoAposLogin } from "@/lib/auth/rules";
import { COOKIE_DA_PORTA, portaDeEntrada } from "@/lib/painel/porta";
import ConfirmarPeloFragmento from "./ConfirmarPeloFragmento";

export const dynamic = "force-dynamic";

/**
 * Recebe o clique no link do e-mail e estabelece a sessão.
 *
 * O Supabase devolve esse retorno em TRÊS formatos, e qual chega depende de
 * como o link foi pedido — não do nosso código:
 *
 *   • `?code=...`                 fluxo PKCE, o padrão quando o pedido saiu
 *                                 do nosso formulário de login
 *   • `?token_hash=...&type=...`  verificação direta de OTP
 *   • `#access_token=...`         fragmento, quando não houve PKCE. O
 *                                 servidor NÃO enxerga fragmento — só o
 *                                 navegador. Por isso existe o componente
 *                                 de cliente abaixo.
 *
 * A primeira versão lia apenas o segundo, e o link chegava pelos outros dois:
 * daí a mensagem "o link está incompleto" em todo acesso.
 */
export default async function ConfirmarPage(props: PageProps<"/auth/confirm">) {
  const params = await props.searchParams;

  const pegar = (chave: string) => {
    const v = params[chave];
    return typeof v === "string" ? v : undefined;
  };

  // Quem clicou num link vencido volta para a porta de onde veio. Antes toda
  // falha ia para /login, e o jornalista caía numa página de assinatura com
  // "Criar conta gratuita" — longe de qualquer coisa que resolvesse.
  const porta = portaDeEntrada((await cookies()).get(COOKIE_DA_PORTA)?.value);

  const erro = pegar("error_description") ?? pegar("error");
  if (erro) redirect(`${porta}?motivo=link-expirado`);

  const code = pegar("code");
  const tokenHash = pegar("token_hash");
  const type = pegar("type") as EmailOtpType | undefined;

  if (code || (tokenHash && type)) {
    const supabase = await createClient();

    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });

    if (error) redirect(`${porta}?motivo=link-expirado`);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) redirect(`${porta}?motivo=sessao`);

    // Sem descartar o erro: papel nulo por falha de leitura mandaria quem
    // escreve para /hub, e de lá para /admin, que o devolve para a porta
    // dizendo "sessão expirou". Laço fechado, sem erro em lugar nenhum.
    const { data: profile, error: erroPerfil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (erroPerfil) redirect(`${porta}?motivo=perfil-ilegivel`);

    redirect(destinoAposLogin(profile?.role));
  }

  // Nada na query. Pode ser o fragmento, que só o navegador lê.
  return <ConfirmarPeloFragmento porta={porta} />;
}
