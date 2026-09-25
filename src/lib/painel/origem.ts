/**
 * De onde o link mágico volta.
 *
 * Três lugares montavam esse endereço com `?? "http://localhost:3000"`. Em
 * produção, uma variável esquecida faria o e-mail chegar com um link para a
 * MÁQUINA DE QUEM CLICOU — login quebrado, e em silêncio: o envio dá certo,
 * o e-mail chega, e o link simplesmente não leva a lugar nenhum.
 *
 * Por isso a queda para localhost vale só fora da Vercel. Rodando lá sem
 * endereço definido, a função falha: erro no log é diagnosticável, e-mail
 * com link para localhost não é.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` é o domínio estável do projeto, não o da
 * implantação — o da implantação muda a cada deploy e nunca bateria com a
 * lista de Redirect URLs do Supabase.
 */
export function origemDoSite(
  env: Record<string, string | undefined> = process.env
): string {
  const explicito = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicito) return explicito.replace(/\/+$/, "");

  const daVercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (daVercel) return `https://${daVercel.replace(/\/+$/, "")}`;

  if (env.VERCEL) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL não está definida em produção. Sem ela o link de acesso " +
        "apontaria para localhost e ninguém conseguiria entrar."
    );
  }

  return "http://localhost:3000";
}
