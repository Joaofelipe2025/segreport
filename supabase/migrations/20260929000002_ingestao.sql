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
