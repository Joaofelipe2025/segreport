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
