-- SEGREPORT — ativar o vigia de fontes
-- Projeto: hdzfleptasoepfsalqad   |   Seguro reexecutar.

create table if not exists public.pautas (
  id            uuid primary key default gen_random_uuid(),
  fonte         text not null,
  -- 'imprensa' nunca alcança o gerador de matéria. Ver src/lib/vigia/fontes.ts.
  tipo_de_fonte text not null check (tipo_de_fonte in ('imprensa', 'primaria')),
  titulo        text not null,
  -- A chave de dedupe. Não é o título: veículos diferentes cobrem o mesmo
  -- fato com títulos parecidos, e isso é informação, não repetição.
  url           text not null unique,
  resumo        text,
  publicado_em  timestamptz,
  estado        text not null default 'nova'
                check (estado in ('nova', 'lida', 'descartada', 'virou_materia')),
  article_id    uuid references public.articles(id) on delete set null,
  criado_em     timestamptz not null default now()
);

create index if not exists pautas_estado_idx on public.pautas (estado, criado_em desc);

create table if not exists public.vigia_execucoes (
  id          uuid primary key default gen_random_uuid(),
  comecou_em  timestamptz not null default now(),
  -- {"cqcs": 3, "apolice": 0}
  achados     jsonb not null default '{}'::jsonb,
  -- {"cqcs": "HTTP 503"} — vazio quando tudo correu bem
  falhas      jsonb not null default '{}'::jsonb
);

create index if not exists vigia_execucoes_comecou_em_idx
  on public.vigia_execucoes (comecou_em desc);

alter table public.pautas enable row level security;
alter table public.vigia_execucoes enable row level security;

-- Só admin lê, no padrão de `ingestao_recebidas`. A escrita é da rota, com a
-- chave de serviço; nenhum papel do navegador escreve aqui.
drop policy if exists pautas_admin_select on public.pautas;
create policy pautas_admin_select on public.pautas
  for select to authenticated using (public.is_admin());

drop policy if exists pautas_admin_update on public.pautas;
create policy pautas_admin_update on public.pautas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists vigia_execucoes_admin_select on public.vigia_execucoes;
create policy vigia_execucoes_admin_select on public.vigia_execucoes
  for select to authenticated using (public.is_admin());

-- Escopo de coluna no update de pautas: RLS libera a LINHA a quem é admin,
-- mas não a COLUNA — sem isto um admin autenticado via PostgREST reescrevia
-- `tipo_de_fonte`, o campo que torna a CON-1 verificável. O revoke da tabela
-- vem antes do grant coluna a coluna: privilégio de coluna é ignorado
-- enquanto o papel ainda tem o privilégio da tabela inteira.
revoke update on public.pautas from authenticated;
grant update (estado, article_id) on public.pautas to authenticated;

-- Conferência: devem sair três linhas "ok".
select 'tabela de pautas' as item,
       case when to_regclass('public.pautas') is not null
            then 'ok' else 'FALTOU' end as estado
union all
select 'tabela de execucoes do vigia',
       case when to_regclass('public.vigia_execucoes') is not null
            then 'ok' else 'FALTOU' end
union all
select 'update de pautas restrito por coluna',
       case when (
              select count(*) from information_schema.column_privileges
               where table_schema = 'public' and table_name = 'pautas'
                 and grantee = 'authenticated' and privilege_type = 'UPDATE'
            ) = 2
            then 'ok' else 'FALTOU' end;
