import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com a chave `service_role`.
 *
 * ATENÇÃO — esta chave IGNORA TODA A RLS. São cinco usos, e cada um está
 * aqui porque a alternativa exigiria aplicar DDL à mão no Supabase ou
 * porque não existe sessão de usuário para vestir a RLS:
 *
 *   1. Convidar colunista (`admin/colunistas/actions.ts`): criar conta
 *      alheia, que nenhuma policy permite.
 *   2. Enviar capa de matéria (`admin/materias/upload.ts`): as políticas de
 *      `storage.objects` são DDL, e uma dependência de DDL manual já deixou
 *      este CMS inoperante uma vez.
 *   3. Inscrever na newsletter (`portal/newsletter/actions.ts`): quem se
 *      inscreve é visitante anônimo, e `newsletter_subscribers` não concede
 *      insert a `anon` — a lista de e-mails não é escrita nem lida pelo
 *      navegador.
 *   4. Receber matéria do agente externo (`/api/ingestao/materias`): quem
 *      chama é um GPT, sem sessão; a rota confere o token compartilhado
 *      antes de tocar no cliente admin.
 *   5. Registrar execução do vigia (`/api/vigia/execucao`): quem chama é um
 *      job agendado, também sem sessão — só a chave de serviço grava
 *      `pautas` e `vigia_execucoes`, cuja RLS permite somente leitura de
 *      admin.
 *
 * Nos usos 1 e 2 a autorização mora na Server Action, com `requirePainel()`
 * ou `requireRole()` na primeira linha. No 3 a ação é pública de propósito,
 * e o alcance é um único insert numa tabela que ninguém lê pelo navegador.
 * Nos 4 e 5 a rota confere o token antes de criar o cliente.
 *
 * Regras, sem exceção:
 *   • Só este arquivo importa a chave.
 *   • Um uso novo precisa de justificativa escrita aqui, E a lista acima
 *     precisa continuar batendo com:
 *
 *         grep -rn "criarClienteAdmin()" src/ | grep -v admin.ts
 *
 *     Lista que se apresenta como completa sem estar é pior do que lista
 *     nenhuma: faz o próximo leitor parar de conferir.
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
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para usar a chave de serviço."
    );
  }

  return createClient<Database>(url, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
