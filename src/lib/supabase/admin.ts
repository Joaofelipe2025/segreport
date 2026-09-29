import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com a chave `service_role`.
 *
 * ATENÇÃO — esta chave IGNORA TODA A RLS. Cada uso está aqui porque a
 * alternativa exigiria aplicar DDL à mão no Supabase ou não existe sessão
 * de usuário para vestir a RLS:
 *
 *   1. Convidar colunista: criar conta alheia, que nenhuma policy permite.
 *   2. Enviar capa de matéria: as políticas de `storage.objects` são DDL, e
 *      uma dependência de DDL manual já deixou este CMS inoperante uma vez.
 *   3. Registrar execução do vigia (`/api/vigia/execucao`): quem chama é um
 *      job agendado, sem sessão de `authenticated` — só a chave de serviço
 *      grava `pautas` e `vigia_execucoes`, cuja RLS permite somente leitura
 *      de admin.
 *
 * Nas ações 1 e 2 a autorização mora na Server Action, com `requirePainel()`
 * ou `requireRole()` na primeira linha; na 3, a rota autentica o chamador
 * pelo token compartilhado antes de tocar no cliente admin, no mesmo padrão
 * de `/api/ingestao/materias`. O alcance de cada uso é estreito de propósito.
 *
 * Regras, sem exceção:
 *   • Só este arquivo importa a chave.
 *   • Só os usos acima usam este cliente. Um uso novo precisa de
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
