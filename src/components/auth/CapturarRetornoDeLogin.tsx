"use client";

import { useEffect } from "react";

/**
 * Encaminha para `/auth/confirm` quando um retorno de login cai na página
 * errada.
 *
 * Isso acontece o tempo todo na prática: se o endereço de retorno não estiver
 * na lista de Redirect URLs do projeto, o Supabase IGNORA o destino pedido e
 * manda para o Site URL — normalmente a home, que não sabe o que fazer com o
 * token. O usuário vê a home normal, acha que o link não funcionou, e não há
 * erro em lugar nenhum.
 *
 * O token vem no fragmento (`#access_token=…`) ou na query (`?code=…`), e
 * este componente só o repassa: quem estabelece a sessão continua sendo
 * `/auth/confirm`, um lugar só.
 *
 * Não substitui configurar o Redirect URL — é rede de proteção para quando
 * alguém esquecer, o que inclui o dia em que o domínio de produção entrar.
 */
export default function CapturarRetornoDeLogin() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/auth/confirm")) return;

    const hash = window.location.hash.slice(1);
    const temTokenNoFragmento = hash.includes("access_token=");
    const temErroNoFragmento = hash.includes("error_description=") || hash.includes("error=");

    if (temTokenNoFragmento || temErroNoFragmento) {
      window.location.replace(`/auth/confirm#${hash}`);
      return;
    }

    const busca = new URLSearchParams(window.location.search);
    if (busca.has("code") || busca.has("token_hash")) {
      window.location.replace(`/auth/confirm${window.location.search}`);
    }
  }, []);

  return null;
}
