-- ============================================================================
-- Endurecimento OPCIONAL: fechar a inserção anônima direta
--
-- NADA depende desta migração. A newsletter e a contagem de leituras
-- funcionam sem ela, com limite por origem aplicado nas Server Actions
-- (src/lib/portal/limitador.ts) e gravação pela chave de serviço.
--
-- O que ela resolve é o caminho que o código não alcança: quem bate DIRETO no
-- PostgREST do Supabase, sem passar pelo site. Hoje `newsletter_insert_public`
-- e `article_views_insert_anon` deixam qualquer um inserir à vontade. Não
-- vaza nada — as duas tabelas só são LIDAS por admin —, mas enche a base e
-- consome cota.
--
-- Depois de aplicar, a inserção passa a ser exclusividade do servidor, que é
-- por onde o site já grava.
--
-- Para aplicar: cole no editor SQL do Supabase. Para não aplicar: não faça
-- nada — o site continua igual.
-- ============================================================================

-- 1. NEWSLETTER ------------------------------------------------------------
-- A política de junho permitia insert a qualquer um. A inscrição agora passa
-- por `inscreverNaNewsletter`, que valida o e-mail e limita por origem.

drop policy if exists "newsletter_insert_public" on public.newsletter_subscribers;

-- 2. CONTAGEM DE LEITURAS ---------------------------------------------------
-- `article_views` recebia insert anônimo sem teto. O contador que o portal
-- usa é `articles.view_count`, alimentado pela função `security definer`
-- `increment_article_views`, que só toca matéria publicada.

drop policy if exists "article_views_insert_anon" on public.article_views;

-- 3. CONFERÊNCIA ------------------------------------------------------------
-- Depois de aplicar, isto deve devolver zero linhas:
--
--   select tablename, policyname, cmd
--     from pg_policies
--    where schemaname = 'public'
--      and tablename in ('newsletter_subscribers', 'article_views')
--      and cmd = 'INSERT'
--      and 'anon' = any(roles);
