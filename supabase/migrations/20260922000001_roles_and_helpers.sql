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
