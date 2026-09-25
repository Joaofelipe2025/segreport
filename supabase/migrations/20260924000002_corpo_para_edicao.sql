-- ============================================================================
-- O corpo da matéria visto de dentro do painel
--
-- A migração 20260922000005 fechou o vazamento do paywall revogando `select`
-- na tabela `articles` e reconcedendo coluna a coluna. `content`,
-- `content_json` e `content_text` ficaram de fora de propósito.
--
-- O que passou despercebido: a revogação é `from anon, authenticated` — e o
-- admin também é `authenticated`. O editor lia `content_json` direto da
-- tabela, recebia 42501, a matéria vinha nula e a página caía em 404. A
-- criação funcionava; o editor é que nunca abria.
--
-- `article_body_json` não resolve. Ela serve o LEITOR: é chaveada por slug e
-- tem ramo público para matéria publicada. No painel o slug é campo editável
-- e não identifica a matéria de forma estável, e não existe leitor do lado de
-- dentro. São duas portas diferentes porque são dois direitos diferentes:
-- direito de ler não é direito de editar.
-- ============================================================================

create or replace function public.article_body_for_edit(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  -- `coalesce` distingue dois casos que o editor NÃO pode confundir:
  -- documento vazio significa "matéria nova, ainda sem texto"; nulo significa
  -- "não pude ler". Se o editor tratasse os dois como vazio, abrir uma
  -- matéria sem direito e salvar apagaria o texto de quem escreveu.
  --
  -- O vazio traz um parágrafo porque o esquema do editor exige `block+`: um
  -- `doc` de conteúdo realmente vazio é documento inválido, não documento em
  -- branco. Espelha `documentoVazio()` em src/lib/editor/document.ts.
  select coalesce(a.content_json, '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb)
    from public.articles a
   where a.id = p_id
     and (
       public.is_admin()
       or a.author_id = public.current_author_id()
     )
$$;

-- Função em `public` nasce executável por PUBLIC. Aqui isso incluiria o
-- anônimo, que não tem nada a fazer nesta porta.
revoke execute on function public.article_body_for_edit(uuid) from public;
revoke execute on function public.article_body_for_edit(uuid) from anon;
grant execute on function public.article_body_for_edit(uuid) to authenticated;
