import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { destinoAposLogin } from "@/lib/auth/rules";
import { COOKIE_DA_PORTA, portaDeEntrada } from "@/lib/painel/porta";

export const dynamic = "force-dynamic";

/**
 * Recebe o clique no link do e-mail e estabelece a sessão.
 *
 * ISTO PRECISA SER UM ROUTE HANDLER, não uma página.
 *
 * A versão anterior era `page.tsx`, ou seja, um Server Component — e a
 * documentação do Next é explícita: "Setting cookies is not supported during
 * Server Component rendering". O cliente SSR do Supabase chamava
 * `cookies().set()`, a chamada lançava, e o `catch` em `supabase/server.ts`
 * engolia. Resultado: `verifyOtp` dava certo, o redirecionamento para /admin
 * acontecia, e NENHUM `Set-Cookie` saía na resposta. O login era verificado e
 * jogado fora, e /admin devolvia a pessoa para a porta dizendo que a sessão
 * tinha expirado.
 *
 * Só o caminho do fragmento funcionava, por acidente: ele roda no navegador,
 * onde o cliente grava o cookie sozinho.
 *
 * O Supabase devolve o retorno em TRÊS formatos, e qual chega depende de como
 * o link foi pedido — não do nosso código:
 *
 *   • `?code=...`                 fluxo PKCE, o padrão a partir do nosso form
 *   • `?token_hash=...&type=...`  verificação direta de OTP
 *   • `#access_token=...`         fragmento, quando não houve PKCE. Fragmento
 *                                 nunca chega ao servidor; ver abaixo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const pegar = (chave: string) => searchParams.get(chave) ?? undefined;

  // De qual porta a pessoa veio, para devolvê-la à certa se o link falhar.
  const porta = portaDeEntrada((await cookies()).get(COOKIE_DA_PORTA)?.value);
  const voltar = (motivo: string) =>
    NextResponse.redirect(new URL(`${porta}?motivo=${motivo}`, origin));

  const erro = pegar("error_description") ?? pegar("error");
  if (erro) return voltar("link-expirado");

  const code = pegar("code");
  const tokenHash = pegar("token_hash");
  const type = pegar("type") as EmailOtpType | undefined;

  if (!code && !(tokenHash && type)) {
    // Nada na query: só pode ser o fragmento, que o navegador não envia. O
    // redirecionamento preserva o `#...` porque o destino não tem fragmento
    // próprio — é o comportamento padrão dos navegadores — e lá uma página de
    // cliente consegue lê-lo.
    return NextResponse.redirect(new URL("/auth/confirm/fragmento", origin));
  }

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });

  if (error) return voltar("link-expirado");

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return voltar("sessao");

  // Sem descartar o erro: papel nulo por falha de leitura mandaria quem
  // escreve para /hub, e de lá para /admin, que o devolve para a porta
  // dizendo "sessão expirou". Laço fechado, sem erro em lugar nenhum.
  const { data: profile, error: erroPerfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (erroPerfil) return voltar("perfil-ilegivel");

  return NextResponse.redirect(new URL(destinoAposLogin(profile?.role), origin));
}
