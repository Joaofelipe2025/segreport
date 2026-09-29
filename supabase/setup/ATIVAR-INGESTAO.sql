-- SEGREPORT — ativar a ingestão do agente (Astra)
-- Projeto: hdzfleptasoepfsalqad   |   Seguro reexecutar.

create table if not exists public.ingestao_recebidas (
  id            uuid primary key default gen_random_uuid(),
  article_id    uuid references public.articles(id) on delete set null,
  hash_conteudo text not null unique,
  titulo        text not null,
  recebido_em   timestamptz not null default now()
);

create index if not exists ingestao_recebidas_recebido_em_idx
  on public.ingestao_recebidas (recebido_em desc);

alter table public.ingestao_recebidas enable row level security;

drop policy if exists ingestao_admin_select on public.ingestao_recebidas;
create policy ingestao_admin_select on public.ingestao_recebidas
  for select to authenticated
  using (public.is_admin());

-- Trava: nada entra publicado por fora do painel.
-- SECURITY INVOKER de propósito — dentro de SECURITY DEFINER, current_user
-- seria o dono da função e a checagem nunca dispararia.
create or replace function public.guard_insert_sem_sessao()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user <> 'service_role' then
    return new;
  end if;

  if new.status not in ('draft', 'in_review') then
    raise exception 'materia vinda de fora do painel entra como rascunho ou em revisao, nunca publicada';
  end if;

  if new.is_premium or new.is_exclusive then
    raise exception 'o acesso da materia e decisao comercial, definida no painel';
  end if;

  if new.published_at is not null then
    raise exception 'a data de publicacao e definida na publicacao, pelo painel';
  end if;

  return new;
end;
$$;

drop trigger if exists articles_guard_insert_sem_sessao on public.articles;
create trigger articles_guard_insert_sem_sessao
  before insert on public.articles
  for each row execute function public.guard_insert_sem_sessao();

-- Conferência: devem sair três linhas "ok".
select 'tabela de ingestao' as item,
       case when to_regclass('public.ingestao_recebidas') is not null
            then 'ok' else 'FALTOU' end as estado
union all
select 'trava contra publicar por fora',
       case when exists (select 1 from pg_trigger
                          where tgname = 'articles_guard_insert_sem_sessao'
                            and not tgisinternal)
            then 'ok' else 'FALTOU' end
union all
select 'so admin le o historico',
       case when exists (select 1 from pg_policies
                          where schemaname = 'public'
                            and tablename  = 'ingestao_recebidas'
                            and policyname = 'ingestao_admin_select')
            then 'ok' else 'FALTOU' end;
