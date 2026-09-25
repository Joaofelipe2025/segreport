"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { destinoAposLogin } from "@/lib/auth/rules";

/**
 * Último recurso: a sessão veio no fragmento da URL.
 *
 * Acontece quando o link foi pedido fora do nosso formulário — por exemplo
 * pelo painel do Supabase ou por um script. Nesse caso não houve troca PKCE,
 * e o Supabase devolve `#access_token=...&refresh_token=...`.
 *
 * Fragmento nunca chega ao servidor: o navegador não o envia na requisição.
 * Por isso a leitura precisa acontecer aqui, e só aqui.
 *
 * O `replaceState` apaga o fragmento da barra de endereço assim que a sessão
 * é gravada — token em histórico de navegação é token vazado.
 */
export default function ConfirmarPeloFragmento({ porta }: { porta: string }) {
  const [estado, setEstado] = useState<"verificando" | "falhou">("verificando");

  useEffect(() => {
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragmento.get("access_token");
    const refreshToken = fragmento.get("refresh_token");

    if (!accessToken || !refreshToken) {
      window.location.replace(`${porta}?motivo=link-invalido`);
      return;
    }

    const supabase = createClient();

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ error }) => {
        if (error) {
          setEstado("falhou");
          window.location.replace(`${porta}?motivo=link-expirado`);
          return;
        }

        window.history.replaceState(null, "", window.location.pathname);

        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
          window.location.replace(`${porta}?motivo=sessao`);
          return;
        }

        // O erro precisa ser olhado, como no Route Handler. Descartá-lo faria
        // papel nulo mandar quem escreve para /hub, e de lá para /admin, que
        // devolve a pessoa para a porta dizendo "sessão expirou". Laço
        // fechado, sem erro em lugar nenhum.
        const { data: perfil, error: erroPerfil } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", auth.user.id)
          .maybeSingle();

        if (erroPerfil) {
          window.location.replace(`${porta}?motivo=perfil-ilegivel`);
          return;
        }

        // A MESMA função que o Route Handler usa: duas cópias da regra de
        // destino divergem na primeira vez que um papel mudar.
        window.location.replace(destinoAposLogin(perfil?.role));
      });
  }, [porta]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-forest-700" />
      <p className="mt-4 text-sm text-ink-3">
        {estado === "verificando" ? "Confirmando seu acesso…" : "Link recusado, redirecionando…"}
      </p>
    </div>
  );
}
