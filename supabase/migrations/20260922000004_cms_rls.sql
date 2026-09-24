-- ============================================================================
-- Policies de RLS do CMS
--
-- Esta é a peça de que todo o resto depende. A interface do painel esconde o
-- que o usuário não pode fazer; estas policies IMPEDEM. A diferença aparece
-- quando alguém chama a API diretamente.
-- ============================================================================

-- MATÉRIAS ===================================================================
-- Nomes das policies antigas conferidos em 20260616000002_rls_policies.sql.
-- `articles_editor_all` dava acesso total a quem tivesse papel 'editor' — que
-- a Task 2 converteu em 'columnist'. Manter essa policy anularia todo o resto:
-- o colunista publicaria por ela.

drop policy if exists "articles_select_free"    on public.articles;
drop policy if exists "articles_select_premium" on public.articles;
drop policy if exists "articles_editor_all"     on public.articles;

alter table public.articles enable row level security;

-- Leitura --------------------------------------------------------------------
--
-- Toda matéria publicada é legível, INCLUSIVE a marcada como premium.
--
-- Parece afrouxar o paywall, mas é o desenho da spec. A linha carrega título,
-- linha de apoio, capa e metadados, que precisam ser públicos e indexáveis —
-- são o canal de aquisição por busca. O que é restrito é o CORPO, e ele não
-- sai por aqui: a página estática entrega o documento até o corte, e a
-- continuação vem de /api/materia/[slug]/restrito, que confere o plano na
-- sessão. A policy antiga escondia a matéria inteira do não assinante, e
-- escondia do Google junto.

create policy articles_select_published on public.articles
  for select to anon, authenticated
  using (status = 'published');

create policy articles_select_own on public.articles
  for select to authenticated
  using (author_id = public.current_author_id());

create policy articles_select_admin on public.articles
  for select to authenticated
  using (public.is_admin());

-- Escrita do colunista --------------------------------------------------------
--
-- O `with check` é a metade que importa. Sem ele o colunista leria a própria
-- matéria em rascunho e a gravaria de volta com status = 'published': o
-- `using` aprova a linha como ela está, o `with check` aprova como ela fica.

create policy articles_insert_columnist on public.articles
  for insert to authenticated
  with check (
    author_id = public.current_author_id()
    and status in ('draft', 'in_review')
  );

create policy articles_update_columnist on public.articles
  for update to authenticated
  using (
    author_id = public.current_author_id()
    and status in ('draft', 'in_review')
  )
  with check (
    author_id = public.current_author_id()
    and status in ('draft', 'in_review')
  );

-- Escrita do admin ------------------------------------------------------------

create policy articles_insert_admin on public.articles
  for insert to authenticated with check (public.is_admin());

create policy articles_update_admin on public.articles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy articles_delete_admin on public.articles
  for delete to authenticated using (public.is_admin());

-- PERFIS ======================================================================
-- `profiles_select_public` expunha papel e plano de TODOS os usuários a
-- visitantes anônimos. Num veículo com assinatura, isso revela quem paga.
-- O portal não precisa de profiles: a assinatura pública das matérias vem de
-- `authors`, que continua com leitura aberta.

drop policy if exists "profiles_select_public" on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Admin gerencia papéis. A trava contra escalada segue valendo: ela barra
-- quem não é admin, e esta policy só concede alcance a quem é.
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- MÍDIA =======================================================================
-- Biblioteca compartilhada entre a equipe: numa redação pequena, obrigar cada
-- pessoa a ressubir a mesma foto gera duplicata e desperdiça armazenamento.
-- Apagar é só do admin, porque remover arquivo em uso quebra matéria alheia.

create policy media_select_staff on public.media_assets
  for select to authenticated
  using (public.current_role() in ('admin', 'columnist'));

create policy media_insert_staff on public.media_assets
  for insert to authenticated
  with check (public.current_role() in ('admin', 'columnist'));

create policy media_update_admin on public.media_assets
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy media_delete_admin on public.media_assets
  for delete to authenticated using (public.is_admin());

-- TAGS ========================================================================
-- Vocabulário do veículo: qualquer um lê, só o admin define.

create policy tags_select_all on public.tags
  for select to anon, authenticated using (true);

create policy tags_write_admin on public.tags
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy article_tags_select_all on public.article_tags
  for select to anon, authenticated using (true);

create policy article_tags_write_staff on public.article_tags
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.articles a
       where a.id = article_id
         and a.author_id = public.current_author_id()
         and a.status in ('draft', 'in_review')
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.articles a
       where a.id = article_id
         and a.author_id = public.current_author_id()
         and a.status in ('draft', 'in_review')
    )
  );
