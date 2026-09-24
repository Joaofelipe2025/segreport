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
