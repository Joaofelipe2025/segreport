-- ============================================================================
-- SEGREPORT — esquema completo, para colar no SQL Editor do Supabase
--
-- Gerado a partir de 7 migrações do repositório, na ordem.
-- Rode UMA vez, num projeto novo e vazio.
--
-- Painel → SQL Editor → New query → colar tudo → Run.
-- ============================================================================


-- ▼▼▼ 20260616000001_initial_schema.sql ▼▼▼

-- ============================================================
-- SEGREPORT — Schema inicial
-- ============================================================

-- ── PROFILES ────────────────────────────────────────────────
-- Extensão de auth.users com plano e dados extras
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  plan        text not null default 'free' check (plan in ('free', 'premium')),
  role        text not null default 'reader' check (role in ('reader', 'editor', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger: cria profile automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── CATEGORIES ──────────────────────────────────────────────
create table public.categories (
  id      serial primary key,
  key     text not null unique,
  label   text not null,
  color   text not null,
  emoji   text not null,
  slug    text not null unique
);

-- Seed das categorias
insert into public.categories (key, label, color, emoji, slug) values
  ('auto',       'Auto',        '#0D6E4F', '🚗', 'auto'),
  ('vida',       'Vida',        '#12956A', '❤️',  'vida'),
  ('saude',      'Saúde',       '#2B6CB0', '🩺', 'saude'),
  ('agro',       'Agro',        '#7A8C1F', '🌱', 'agro'),
  ('resseguros', 'Resseguros',  '#6B5B95', '🛡️', 'resseguros'),
  ('regulacao',  'Regulação',   '#B87214', '⚡', 'regulacao'),
  ('tech',       'Tech',        '#1A6FB0', '💻', 'tech');

-- ── AUTHORS ─────────────────────────────────────────────────
create table public.authors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  bio            text,
  avatar_url     text,
  email          text unique,
  twitter_handle text,
  created_at     timestamptz not null default now()
);

-- Seed: redação padrão
insert into public.authors (name, bio, email) values
  ('Redação Segreport', 'Equipe editorial do Segreport.', 'redacao@segreport.com.br');

-- ── ARTICLES ────────────────────────────────────────────────
create table public.articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  subtitle     text,
  excerpt      text,
  content      text,                             -- markdown ou HTML
  cover_url    text,
  category_id  int references public.categories(id) on delete set null,
  author_id    uuid references public.authors(id) on delete set null,
  status       text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_premium   boolean not null default false,
  is_exclusive boolean not null default false,
  reading_time int,                              -- minutos
  view_count   bigint not null default 0,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index articles_slug_idx       on public.articles (slug);
create index articles_status_idx     on public.articles (status);
create index articles_category_idx   on public.articles (category_id);
create index articles_published_idx  on public.articles (published_at desc) where status = 'published';
create index articles_view_count_idx on public.articles (view_count desc);

-- Full-text search
alter table public.articles
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(excerpt, '')), 'C')
  ) stored;

create index articles_search_idx on public.articles using gin(search_vector);

create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- ── ARTICLE VIEWS ───────────────────────────────────────────
-- Para calcular "Top 10 mais lidas" sem expor dados de usuários
create table public.article_views (
  id         bigserial primary key,
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,  -- null = anônimo
  session_id text,
  ip_hash    text,   -- hash do IP, nunca o IP real
  viewed_at  timestamptz not null default now()
);

create index article_views_article_idx on public.article_views (article_id);
create index article_views_date_idx    on public.article_views (viewed_at desc);

-- RPC: incrementa view_count atomicamente
create or replace function public.increment_article_views(p_article_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.articles
  set view_count = view_count + 1
  where id = p_article_id and status = 'published';
end;
$$;

-- ── NEWSLETTER SUBSCRIBERS ───────────────────────────────────
create table public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  name            text,
  status          text not null default 'active' check (status in ('active', 'unsubscribed')),
  source          text check (source in ('footer', 'sidebar', 'popup', 'cadastro', 'outro')),
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index newsletter_status_idx on public.newsletter_subscribers (status);

-- ── CIRCULARES SUSEP ────────────────────────────────────────
create table public.circulares_susep (
  id           serial primary key,
  code         text not null unique,   -- ex: "723/2026"
  title        text not null,
  summary      text,
  published_at date not null,
  url          text,
  is_new       boolean not null default true,
  category_key text,
  created_at   timestamptz not null default now()
);

create index circulares_date_idx on public.circulares_susep (published_at desc);

-- Seed inicial
insert into public.circulares_susep (code, title, published_at, is_new) values
  ('723/2026', 'Circular SUSEP 723/2026 — Marco regulatório seguros de danos', '2026-06-14', true),
  ('722/2026', 'Circular SUSEP 722/2026 — Limites operacionais resseguradoras', '2026-06-10', true),
  ('721/2026', 'Circular SUSEP 721/2026 — Requisitos capital baseado em risco', '2026-06-02', false);

-- ── MARKET DATA ─────────────────────────────────────────────
create table public.market_data (
  id         serial primary key,
  metric     text not null unique,   -- SELIC, IPCA, USD_BRL, etc.
  label      text not null,
  value      text not null,
  trend      text not null default 'neutral' check (trend in ('positive', 'negative', 'neutral')),
  updated_at timestamptz not null default now()
);

-- Seed com dados atuais
insert into public.market_data (metric, label, value, trend) values
  ('SELIC',          'SELIC',          '10,75%',   'neutral'),
  ('IPCA',           'IPCA',           '4,83%',    'neutral'),
  ('PREMIOS',        'Prêmios',        '+11,4% ↑', 'positive'),
  ('SINISTRALIDADE', 'Sinistralidade', '+2,3pp',   'negative'),
  ('USD_BRL',        'USD/BRL',        'R$5,18',   'neutral'),
  ('CIRC_SUSEP',     'Circ. SUSEP',    '723',      'neutral'),
  ('IRB_BRASIL',     'IRB Brasil',     '+R$180M',  'positive'),
  ('SEGURO_AGRO',    'Seguro agro',    '+22%',     'positive');

-- ── SUBSCRIPTIONS ───────────────────────────────────────────
create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  plan                  text not null check (plan in ('monthly', 'annual')),
  status                text not null default 'active' check (status in ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_subscription_id text unique,
  stripe_customer_id    text,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  trial_end             timestamptz,
  created_at            timestamptz not null default now(),
  cancelled_at          timestamptz,
  updated_at            timestamptz not null default now()
);

create index subscriptions_user_idx   on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ▼▼▼ 20260616000002_rls_policies.sql ▼▼▼

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

-- ▼▼▼ 20260922000001_roles_and_helpers.sql ▼▼▼

-- ============================================================================
-- Papéis do CMS, ligação entre conta e autoria, funções auxiliares de RLS
-- ============================================================================

-- Papéis ---------------------------------------------------------------------
-- A coluna `role` JÁ EXISTE desde a migração de junho, com os valores
-- reader | editor | admin. O CMS troca 'editor' por 'columnist', que é o papel
-- que a máquina de estados da matéria conhece.
--
-- A ORDEM importa: converter os dados ANTES de trocar a restrição. Na ordem
-- inversa, a restrição nova recusaria as linhas existentes.

alter table public.profiles
  add column if not exists invited_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles set role = 'columnist' where role = 'editor';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'columnist', 'reader'));

-- Assinatura pública ---------------------------------------------------------
-- `authors` tem name, bio, avatar_url, email e twitter_handle. Faltam o slug
-- da página pública, o cargo exibido na assinatura, e a ligação com a conta.

alter table public.authors
  add column if not exists slug text,
  add column if not exists role text;

-- Preenche o slug das linhas existentes antes de exigir unicidade.
update public.authors
   set slug = regexp_replace(
         lower(translate(name,
           'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
           'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
         '[^a-z0-9]+', '-', 'g')
 where slug is null;

create unique index if not exists authors_slug_key on public.authors (slug);

-- Ligação entre a conta que entra e a assinatura pública.
-- Anulável de propósito: "Redação SegReport" assina matéria e não tem conta.
-- on delete set null preserva a autoria histórica quando a conta é removida —
-- a matéria continua assinada, o acesso é que acaba.

alter table public.authors
  add column if not exists profile_id uuid unique
  references public.profiles(id) on delete set null;

-- Funções auxiliares ---------------------------------------------------------
-- security definer com search_path fixo é obrigatório: sem ele, a policy de
-- profiles impediria a própria função de ler a linha de que precisa.

create or replace function public.current_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) = 'admin',
    false
  )
$$;

create or replace function public.current_author_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select id from public.authors where profile_id = auth.uid()
$$;

revoke execute on function public.current_role() from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.current_author_id() from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_author_id() to authenticated;

-- Escalada de papel é impossível ---------------------------------------------
-- O usuário pode editar o próprio perfil, mas nunca a coluna `role`. Sem esta
-- trava, todas as outras policies são contornáveis: bastaria o colunista se
-- promover a admin e o resto do sistema abriria sozinho.

-- A trava vale para REQUISIÇÃO DE USUÁRIO, identificada por haver um `sub` na
-- sessão. Quando `auth.uid()` é nulo não há usuário final pedindo: é migração,
-- semente, ou a chave de serviço no fluxo de convite — que precisa gravar
-- 'columnist' num perfil recém-criado. Barrar esse caminho quebraria o convite.
--
-- Deixar passar quando não há sessão é seguro porque a RLS já impede o
-- visitante anônimo de atualizar qualquer linha de profiles: a policy de
-- escrita casa por `id = auth.uid()`, e nulo não casa com nada.
create or replace function public.guard_profile_role() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'apenas administradores alteram papel';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ▼▼▼ 20260922000002_articles_cms.sql ▼▼▼

-- ============================================================================
-- Colunas do CMS, máquina de estados da matéria e índices
-- ============================================================================

alter table public.articles
  add column if not exists content_json    jsonb,
  add column if not exists content_text    text,
  add column if not exists standfirst      text,
  add column if not exists scheduled_for   timestamptz,
  add column if not exists seo_title       text,
  add column if not exists seo_description text,
  add column if not exists updated_by      uuid references public.profiles(id) on delete set null;

comment on column public.articles.content_json is
  'Documento de blocos do editor. Cada bloco é tipado, o que permite renderizar como componente e embutir dado do Hub dentro do texto.';

comment on column public.articles.content_text is
  'Texto puro extraído de content_json no salvamento. Existe só para busca — procurar palavra dentro de jsonb não usa índice de texto.';

comment on column public.articles.content is
  'LEGADO. Mantido durante a migração para content_json. Remover em migração futura, quando nenhuma linha depender dele.';

-- Máquina de estados ---------------------------------------------------------
--
--   rascunho ──enviar──▶ em revisão ──aprovar──▶ agendada ──▶ publicada
--       ▲                     │                      │            │
--       └─────devolver────────┘                      └─────┬──────┘
--                                                          ▼
--                                                      arquivada

alter table public.articles drop constraint if exists articles_status_check;

alter table public.articles
  add constraint articles_status_check
  check (status in ('draft', 'in_review', 'scheduled', 'published', 'archived'));

-- Agendada sem horário é um estado impossível: a rotina de publicação procura
-- por scheduled_for, e uma linha sem ele nunca sairia do limbo.
alter table public.articles drop constraint if exists articles_scheduled_needs_time;

alter table public.articles
  add constraint articles_scheduled_needs_time
  check (status <> 'scheduled' or scheduled_for is not null);

-- Índices --------------------------------------------------------------------

create index if not exists articles_status_published_idx
  on public.articles (status, published_at desc) where status = 'published';

create index if not exists articles_author_idx on public.articles (author_id);

create index if not exists articles_scheduled_idx
  on public.articles (scheduled_for) where status = 'scheduled';

create index if not exists articles_search_idx
  on public.articles using gin (to_tsvector('portuguese', coalesce(content_text, '')));

-- ▼▼▼ 20260922000003_tags_and_media.sql ▼▼▼

-- ============================================================================
-- Tags, vínculo com matéria e biblioteca de mídia
-- ============================================================================

create table if not exists public.tags (
  id    bigint generated always as identity primary key,
  slug  text not null unique,
  label text not null
);

create table if not exists public.article_tags (
  article_id uuid   not null references public.articles(id) on delete cascade,
  tag_id     bigint not null references public.tags(id)     on delete cascade,
  primary key (article_id, tag_id)
);

-- Apagar a matéria leva o vínculo junto, mas nunca a tag: a tag é vocabulário
-- do veículo, não propriedade de uma matéria.
create index if not exists article_tags_tag_idx on public.article_tags (tag_id);

create table if not exists public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  -- Texto alternativo é exigido pelo BANCO, não por validação de formulário.
  -- Acessibilidade cobrada na criação custa segundos; cobrada numa auditoria
  -- futura vira mutirão em centenas de imagens.
  alt          text not null check (length(trim(alt)) >= 3),
  credit       text,
  width        int,
  height       int,
  bytes        int,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists media_assets_created_idx
  on public.media_assets (created_at desc);

alter table public.tags         enable row level security;
alter table public.article_tags enable row level security;
alter table public.media_assets enable row level security;

-- ▼▼▼ 20260922000004_cms_rls.sql ▼▼▼

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

-- ▼▼▼ 20260922000005_column_privileges.sql ▼▼▼

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


-- ============================================================================
-- Alinhar as categorias do banco com a taxonomia do portal
--
-- As categorias vieram da migração de junho, anterior ao desenho editorial
-- atual. Duas divergiam no nome e quatro do menu não existiam — os links
-- /mercado, /politica, /cyber e /beneficios levavam a páginas vazias, e as
-- categorias `agro` e `tech` do banco não correspondiam a link nenhum.
--
-- A chave é o que o portal usa na URL, então renomear é o que reconecta as
-- duas pontas. Usa update, não delete mais insert: matéria já publicada
-- aponta para o id, e apagar a categoria a deixaria órfã.
-- ============================================================================

update public.categories set key = 'agronegocio', slug = 'agronegocio', label = 'Agronegócio'
 where key = 'agro';

update public.categories set key = 'tecnologia', slug = 'tecnologia', label = 'Tecnologia'
 where key = 'tech';

-- As quatro que faltavam. `on conflict do nothing` deixa a migração ser
-- reaplicada sem erro num banco que já as tenha.
insert into public.categories (key, label, color, emoji, slug) values
  ('mercado',    'Mercado',    '#0D6E4F', '📈', 'mercado'),
  ('politica',   'Política',   '#B87214', '🏛️', 'politica'),
  ('cyber',      'Cyber',      '#1A6FB0', '🔐', 'cyber'),
  ('beneficios', 'Benefícios', '#12956A', '🧾', 'beneficios')
on conflict (key) do nothing;


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
