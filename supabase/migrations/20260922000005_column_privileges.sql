-- ============================================================================
-- Correções da revisão final: o que a RLS NÃO resolve
--
-- RLS é row-level. Liberar a linha libera TODAS as colunas dela. Três coisas
-- precisavam de outra ferramenta, e as três vazavam pela API REST com a chave
-- pública — não pelo HTML, que é onde o desenho anterior olhava.
-- ============================================================================

-- 1. CORPO DE MATÉRIA RESTRITA ==============================================
--
-- A policy articles_select_published libera a linha da matéria premium de
-- propósito: título, capa e metadados precisam ser indexáveis. Mas ela
-- liberava o corpo junto, e `GET /rest/v1/articles?select=content` com a
-- chave anônima devolvia o texto pago inteiro.
--
-- Privilégio de coluna resolve o vazamento; a entrega condicional passa a
-- ser feita por função, que é o único lugar onde cabe a regra "depende de
-- quem pede E de qual linha é".

-- SEMÂNTICA DO POSTGRES que é fácil errar: privilégio de coluna só é
-- consultado quando NÃO há privilégio de tabela. Um `revoke select (coluna)`
-- sobre quem tem `select` na tabela inteira não surte efeito nenhum — e não
-- avisa. É preciso revogar no nível da tabela e reconceder coluna a coluna.
--
-- `search_vector` fica de fora junto com o corpo: é derivado do texto e
-- devolveria as palavras da matéria paga.

revoke select on public.articles from anon, authenticated;

grant select (
  id, slug, title, subtitle, excerpt, cover_url, category_id, author_id,
  status, is_premium, is_exclusive, reading_time, view_count, published_at,
  created_at, updated_at, standfirst, scheduled_for, seo_title,
  seo_description, updated_by
) on public.articles to anon, authenticated;

/**
 * Corpo da matéria, entregue conforme o direito de quem pede.
 *
 * Devolve nulo em vez de erro quando não há direito: a página precisa
 * renderizar a chamada de assinatura, não quebrar.
 */
create or replace function public.article_body(p_slug text)
returns text
language sql stable security definer set search_path = public as $$
  select a.content
    from public.articles a
   where a.slug = p_slug
     and (
       -- Quem edita vê sempre.
       public.is_admin()
       or a.author_id = public.current_author_id()
       -- Publicada e aberta: qualquer um.
       or (a.status = 'published' and a.is_premium = false)
       -- Publicada e paga: só quem assina.
       or (
         a.status = 'published'
         and a.is_premium = true
         and coalesce(
           (select p.plan from public.profiles p where p.id = auth.uid()),
           'free'
         ) = 'premium'
       )
     )
$$;

create or replace function public.article_body_json(p_slug text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select a.content_json
    from public.articles a
   where a.slug = p_slug
     and (
       public.is_admin()
       or a.author_id = public.current_author_id()
       or (a.status = 'published' and a.is_premium = false)
       or (
         a.status = 'published'
         and a.is_premium = true
         and coalesce(
           (select p.plan from public.profiles p where p.id = auth.uid()),
           'free'
         ) = 'premium'
       )
     )
$$;

grant execute on function public.article_body(text) to anon, authenticated;
grant execute on function public.article_body_json(text) to anon, authenticated;

-- 2. PLANO DO ASSINANTE =====================================================
--
-- `profiles_update_own` é `to public` e sem escopo de coluna: qualquer leitor
-- autenticado fazia PATCH /rest/v1/profiles e se dava plan='premium'. O
-- gatilho de junho protegia só `role`. O paywall inteiro caía numa chamada.
--
-- Mesmo padrão já provado para `role`, estendido: a trava vale para
-- requisição de usuário, identificada por haver sessão. Sem sessão é
-- migração, semente ou chave de serviço — e o Stripe precisará desse caminho
-- para promover quem pagou.

create or replace function public.guard_profile_privileges() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'apenas administradores alteram papel';
  end if;

  if new.plan is distinct from old.plan then
    raise exception 'plano é definido pela assinatura, não pelo usuário';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- 3. E-MAIL DO COLUNISTA ====================================================
--
-- `authors_select_public` é `using (true)`, o que era inofensivo enquanto
-- authors.email tinha só o endereço da redação. A ação de convite passou a
-- gravar ali o e-mail pessoal de cada colunista, e este branch acrescentou
-- profile_id, que liga a assinatura pública ao id da conta.
--
-- Mesmo raciocínio que derrubou profiles_select_public: nome, bio e foto são
-- públicos; contato e vínculo com a conta, não.

-- Mesma correção de semântica: revogar a tabela e reconceder as colunas.
--
-- Restrito ao `anon`, que é a chave pública embutida no site — o vetor que
-- importa. Usuário autenticado continua enxergando, porque o painel lista os
-- e-mails pela sessão do próprio admin. Estreitar isso exige uma função
-- própria para o painel, e está anotado como pendência.

revoke select on public.authors from anon;

grant select (id, name, bio, avatar_url, twitter_handle, created_at, slug, role)
  on public.authors to anon;

-- 4. COLUNAS COMERCIAIS DA MATÉRIA ==========================================
--
-- articles_update_columnist não tem escopo de coluna. O colunista podia,
-- no próprio rascunho, gravar view_count = 999999 — número que alimenta o
-- "Mais lidas" do portal — ou marcar a matéria como paga, que é decisão
-- comercial e não editorial.

create or replace function public.guard_article_columns() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.view_count is distinct from old.view_count then
    raise exception 'contagem de leituras não é editável';
  end if;
  if new.is_premium is distinct from old.is_premium
     or new.is_exclusive is distinct from old.is_exclusive then
    raise exception 'acesso da matéria é decisão comercial';
  end if;
  if new.slug is distinct from old.slug then
    raise exception 'o endereço da matéria só muda por administrador';
  end if;
  if new.published_at is distinct from old.published_at then
    raise exception 'a data de publicação é definida na publicação';
  end if;

  return new;
end;
$$;

drop trigger if exists articles_guard_columns on public.articles;
create trigger articles_guard_columns
  before update on public.articles
  for each row execute function public.guard_article_columns();

-- 5. ÍNDICE DE BUSCA ========================================================
--
-- `articles_search_idx` já existia desde junho, sobre search_vector. O
-- `create index if not exists` da migração 2 viu o nome ocupado e pulou em
-- silêncio — o índice sobre content_text, que a spec pede, nunca existiu.

create index if not exists articles_content_text_idx
  on public.articles using gin (to_tsvector('portuguese', coalesce(content_text, '')));
