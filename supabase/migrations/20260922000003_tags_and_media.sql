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
