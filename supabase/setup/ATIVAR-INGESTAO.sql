-- ════════════════════════════════════════════════════════════════════════
--  SEGREPORT — ATIVAR A INGESTÃO DO AGENTE (Astra)
--
--  Cole este arquivo INTEIRO no editor SQL do Supabase e execute.
--  Projeto correto: hdzfleptasoepfsalqad
--
--  É seguro reexecutar: tudo usa `if not exists` / `or replace`.
--  Depois de rodar, a última consulta confere e imprime o resultado.
-- ════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- Ingestão de matérias por agente externo
--
-- Uma tabela, dois problemas que não cabiam no esquema existente.
--
-- 1. IDEMPOTÊNCIA. O agente chama por HTTP e pode repetir a chamada — Actions
--    do GPT expiram perto de 45s e o modelo re-chama. Sem uma chave de
--    conteúdo, o reenvio vira matéria duplicada na fila.
--
--    A chave NÃO pode ser o slug. Coluna diária repete título por natureza
--    ("Boletim do dia"), e é por isso que `src/lib/painel/endereco.ts` existe
--    e resolve com sufixo. Pior: o slug é recalculado a cada gravação
--    enquanto a matéria não foi publicada, então ele se move durante a
--    revisão. Hash do conteúdo não se move.
--
-- 2. PROCEDÊNCIA. `articles` não tem coluna de origem, e a assinatura é
--    sempre "Da Redação" por decisão editorial. Sem esta tabela, daqui a mil
--    matérias não há como responder "quais foram redigidas pelo agente?" —
--    pergunta que pode importar muito, e cuja resposta ficaria irrecuperável.
--
--    A alternativa considerada era usar `updated_by is null` como marca. Não
--    serve: a coluna é `on delete set null`, então apagar um perfil marcaria
--    retroativamente todas as matérias dele; `mudarEstado` a preenche, então
--    publicar sem abrir o editor apaga o sinal; e ela está no grant público,
--    o que faria uma publicada com nulo virar bandeira legível por máquina de
--    "isto é IA" — o oposto exato da decisão editorial tomada.
-- ============================================================================

create table if not exists public.ingestao_recebidas (
  id            uuid primary key default gen_random_uuid(),
  -- `set null` e não `cascade`: apagar a matéria não pode apagar o registro
  -- de que ela foi recebida de fora. O histórico é o ponto.
  article_id    uuid references public.articles(id) on delete set null,
  hash_conteudo text not null unique,
  titulo        text not null,
  recebido_em   timestamptz not null default now()
);

-- A contagem por janela de tempo é o limite de taxa que sobrevive a cold
-- start — o limitador em memória não sobrevive, e o IP de origem do agente é
-- um pool rotativo compartilhado.
create index if not exists ingestao_recebidas_recebido_em_idx
  on public.ingestao_recebidas (recebido_em desc);

alter table public.ingestao_recebidas enable row level security;

-- Ninguém lê isto pela chave publicável. A rota grava com a chave de serviço,
-- que ignora RLS; o painel lê como admin.
drop policy if exists ingestao_admin_select on public.ingestao_recebidas;
create policy ingestao_admin_select on public.ingestao_recebidas
  for select to authenticated
  using (public.is_admin());


-- ============================================================================
-- Endurecimento OPCIONAL: nada entra publicado por fora do painel
--
-- NADA depende desta migração. A ingestão grava `status = 'in_review'` e
-- funciona sem ela.
--
-- O que ela resolve: hoje, o ÚNICO obstáculo entre a rota de ingestão e uma
-- matéria publicada é o nosso próprio código. `articles_insert_admin` exige
-- `is_admin()`, mas a chave de serviço ignora RLS inteira; e
-- `guard_article_columns` é `before update` apenas, escapando quem tem
-- `auth.uid() is null`. Uma regressão de uma linha na rota e a promessa
-- "nada publica sozinho" morre em silêncio.
--
-- A doutrina que este projeto escreveu na própria migração de RLS — "a
-- interface esconde o que o usuário não pode fazer; estas policies IMPEDEM"
-- — não tinha contraparte no caminho de insert sem sessão. Isto é a
-- contraparte.
--
-- Nada legítimo quebra: todo insert vindo do painel carrega sessão, e
-- portanto `auth.uid()` não é nulo.
--
-- Para aplicar: cole no editor SQL do Supabase. Para não aplicar: não faça
-- nada.
-- ============================================================================

-- SECURITY INVOKER, de propósito — e é a diferença entre funcionar e não
-- funcionar. Dentro de uma função `security definer`, `current_user` é o DONO
-- da função, nunca quem a chamou: a checagem compararia o dono com
-- 'service_role' e nunca dispararia. A função só levanta exceção, então não
-- precisa de privilégio nenhum emprestado.
create or replace function public.guard_insert_sem_sessao()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- A condição é `current_user`, não `auth.uid() is null`, e a diferença
  -- importa: `auth.uid()` também é nulo em migração, em semente e na suíte de
  -- testes, que legitimamente criam matéria publicada. Guardar por ali
  -- quebraria tudo isso.
  --
  -- `service_role` é o papel com que o PostgREST conecta quando a chamada usa
  -- a chave de serviço — exatamente, e apenas, o caminho da ingestão.
  if current_user <> 'service_role' then
    return new;
  end if;

  if new.status not in ('draft', 'in_review') then
    raise exception
      'matéria vinda de fora do painel entra como rascunho ou em revisão, nunca publicada';
  end if;

  if new.is_premium or new.is_exclusive then
    raise exception 'o acesso da matéria é decisão comercial, definida no painel';
  end if;

  if new.published_at is not null then
    raise exception 'a data de publicação é definida na publicação, pelo painel';
  end if;

  return new;
end;
$$;

drop trigger if exists articles_guard_insert_sem_sessao on public.articles;
create trigger articles_guard_insert_sem_sessao
  before insert on public.articles
  for each row execute function public.guard_insert_sem_sessao();


-- ════════════════════════════════════════════════════════════════════════
--  CONFERÊNCIA — deve imprimir três linhas com "ok"
-- ════════════════════════════════════════════════════════════════════════

select
  'tabela de ingestão' as item,
  case when to_regclass('public.ingestao_recebidas') is not null
       then 'ok' else 'FALTOU' end as estado
union all
select
  'trava contra publicar por fora',
  case when exists (
    select 1 from pg_trigger
     where tgname = 'articles_guard_insert_sem_sessao'
       and not tgisinternal
  ) then 'ok' else 'FALTOU' end
union all
select
  'só admin lê o histórico',
  case when exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename  = 'ingestao_recebidas'
       and policyname = 'ingestao_admin_select'
  ) then 'ok' else 'FALTOU' end;
