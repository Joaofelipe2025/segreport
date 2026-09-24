import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com a chave `service_role`.
 *
 * ATENÇÃO — esta chave IGNORA TODA A RLS. Ela existe por uma única razão:
 * convidar usuário exige criar conta alheia, e nenhuma policy permite isso.
 *
 * Regras, sem exceção:
 *   • Só este arquivo importa a chave.
 *   • Só a ação de convite usa este cliente.
 *   • Nunca em componente de página, nem em rota chamada pelo navegador sem
 *     verificação de papel antes.
 *
 * O `server-only` acima faz o build FALHAR se alguém importar isto de um
 * componente de cliente — a proteção é do compilador, não da disciplina.
 */
export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para convidar usuários."
    );
  }

  return createClient<Database>(url, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
