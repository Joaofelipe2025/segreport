"use server";

import { createClient } from "@/lib/supabase/server";
import { criarLimitador, origemDaRequisicao } from "@/lib/portal/limitador";
import { headers } from "next/headers";

/**
 * Registra uma leitura.
 *
 * O contador existia no banco desde o começo e NINGUÉM o chamava: a coluna
 * `view_count` era zero em toda matéria, e "Mais lidas" — no portal e no
 * painel — ordenava por ela. Um bloco inteiro decorativo.
 *
 * Por que uma Server Action chamada do cliente, e não a contagem direto na
 * página: o Next pré-carrega a rota quando o mouse passa sobre o link. Contar
 * no servidor, durante a renderização, transformaria passar o mouse pela home
 * em leitura — e a métrica nasceria mentindo.
 *
 * A função no banco é `security definer` e só incrementa matéria publicada,
 * então não há como inflar rascunho.
 */
const limitador = criarLimitador({ cota: 40, janelaMs: 60_000 });

export async function registrarLeitura(slug: string): Promise<void> {
  if (!slug) return;

  const origem = origemDaRequisicao(await headers());
  if (!limitador.permite(origem)) return;

  const supabase = await createClient();

  // O identificador é resolvido AQUI, a partir do endereço público. Mandar o
  // uuid para o navegador só para ele devolver não acrescenta nada e espalha
  // a chave interna pelo HTML.
  const { data: materia } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!materia) return;

  const { error } = await supabase.rpc("increment_article_views", { p_article_id: materia.id });

  // Contagem é métrica, não conteúdo: se falhar, a matéria continua de pé.
  // Mas o erro vai para o log — contador quebrado em silêncio vira decisão
  // editorial tomada em cima de número errado.
  if (error) console.error("[leitura] increment_article_views:", error.message);
}
