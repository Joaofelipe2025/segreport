-- ============================================================
-- SEGREPORT — Row Level Security (RLS)
-- ============================================================

-- ── PROFILES ────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Leitura pública dos perfis (nome, avatar)
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Usuário só atualiza o próprio perfil
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── CATEGORIES ──────────────────────────────────────────────
alter table public.categories enable row level security;

create policy "categories_select_public"
  on public.categories for select
  using (true);

-- Apenas admins modificam categorias
create policy "categories_admin_all"
  on public.categories for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── AUTHORS ─────────────────────────────────────────────────
alter table public.authors enable row level security;

create policy "authors_select_public"
  on public.authors for select
  using (true);

create policy "authors_admin_all"
  on public.authors for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ── ARTICLES ────────────────────────────────────────────────
alter table public.articles enable row level security;

-- Artigos publicados e gratuitos: acesso público
create policy "articles_select_free"
  on public.articles for select
  using (
    status = 'published'
    and is_premium = false
  );

-- Artigos premium: apenas usuários com plano premium
create policy "articles_select_premium"
  on public.articles for select
  using (
    status = 'published'
    and is_premium = true
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and plan = 'premium'
    )
  );

-- Editors e admins: acesso completo (incluindo drafts)
create policy "articles_editor_all"
  on public.articles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ── ARTICLE VIEWS ───────────────────────────────────────────
alter table public.article_views enable row level security;

-- Qualquer um pode inserir uma visualização
create policy "article_views_insert_anon"
  on public.article_views for insert
  with check (true);

-- Admins podem ler todas as views
create policy "article_views_admin_select"
  on public.article_views for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── NEWSLETTER SUBSCRIBERS ───────────────────────────────────
alter table public.newsletter_subscribers enable row level security;

-- Qualquer um pode se inscrever (insert)
create policy "newsletter_insert_public"
  on public.newsletter_subscribers for insert
  with check (true);

-- Apenas admins lêem a lista
create policy "newsletter_admin_select"
  on public.newsletter_subscribers for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── CIRCULARES SUSEP ────────────────────────────────────────
alter table public.circulares_susep enable row level security;

create policy "circulares_select_public"
  on public.circulares_susep for select
  using (true);

create policy "circulares_admin_all"
  on public.circulares_susep for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── MARKET DATA ─────────────────────────────────────────────
alter table public.market_data enable row level security;

create policy "market_data_select_public"
  on public.market_data for select
  using (true);

create policy "market_data_admin_all"
  on public.market_data for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── SUBSCRIPTIONS ───────────────────────────────────────────
alter table public.subscriptions enable row level security;

-- Usuário só vê sua própria assinatura
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Admins vêem tudo
create policy "subscriptions_admin_all"
  on public.subscriptions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
