import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_DA_PORTA, portaDeEntrada } from "@/lib/painel/porta";
import ConfirmarPeloFragmento from "./ConfirmarPeloFragmento";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Onde o fragmento é lido.
 *
 * `/auth/confirm` é Route Handler porque só ali dá para gravar cookie — e
 * Route Handler não renderiza componente de cliente. Quando o retorno vem no
 * fragmento (`#access_token=...`), que o navegador nunca envia ao servidor,
 * ele redireciona para cá, e o `#...` viaja junto: o destino não tem
 * fragmento próprio, então o navegador mantém o da origem.
 *
 * Aqui quem estabelece a sessão é o cliente do navegador, que grava o cookie
 * por conta própria.
 */
export default async function ConfirmarFragmentoPage() {
  const porta = portaDeEntrada((await cookies()).get(COOKIE_DA_PORTA)?.value);
  return <ConfirmarPeloFragmento porta={porta} />;
}
