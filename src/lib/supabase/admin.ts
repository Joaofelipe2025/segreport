import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com a chave `service_role`.
 *
 * ATENÇÃO — esta chave IGNORA TODA A RLS. Há exatamente DOIS usos, e cada um
 * está aqui porque a alternativa exigiria aplicar DDL à mão no Supabase:
 *
 *   1. Convidar colunista: criar conta alheia, que nenhuma policy permite.
 *   2. Enviar capa de matéria: as políticas de `storage.objects` são DDL, e
 *      uma dependência de DDL manual já deixou este CMS inoperante uma vez.
 *
 * Nos dois casos a autorização mora na Server Action, com `requirePainel()`
 * ou `requireRole()` na primeira linha, e o alcance de cada ação é estreito
 * de propósito.
 *
 * Regras, sem exceção:
 *   • Só este arquivo importa a chave.
 *   • Só as duas ações acima usam este cliente. Um terceiro uso precisa de
 *     justificativa escrita aqui.
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
