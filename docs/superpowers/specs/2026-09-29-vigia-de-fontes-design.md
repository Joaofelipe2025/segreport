# O Vigia — monitoramento de fontes do mercado segurador

**Data:** 2026-09-29
**Antecede:** a ingestão por API (`docs/integracao/astra.md`), já em produção

---

## Por que isto existe

O SegReport tem um agente de IA ("Astra") que redige matérias e uma porta de
entrada que as recebe — mas alguém precisa **abrir o chat e pedir**. O que o
dono do veículo quer é que o sistema acompanhe o mercado sozinho e traga o que
apareceu, três vezes ao dia.

Um GPT personalizado não faz isso: ele só age quando há uma pessoa digitando.
O que falta é um subsistema que roda por conta própria.

## A decisão que define a arquitetura

Perguntado de onde o Astra pode escrever, o dono respondeu, com estas
palavras: *"usa de alerta, mas não reescreve… outros veículos são importantes
mas não quero plágio, apenas inspiração."*

Isso não é uma preferência a anotar — é o eixo do desenho. O sistema tem
**duas saídas que nunca se cruzam**:

| Saída | De onde pode vir | O que é |
|---|---|---|
| **Pauta** | qualquer fonte, inclusive concorrente | "aconteceu algo, aqui está o link" |
| **Matéria** | **só fonte primária** | texto redigido a partir do documento |

Cobertura de concorrente alimenta **apenas** a fila de pautas. Não existe
caminho no código que leve o texto de outro veículo ao gerador de matéria — e
essa ausência é uma exigência do desenho, não um detalhe de implementação.

## O que foi apurado sobre as fontes

Antes de desenhar, cada fonte foi sondada. Os resultados mudaram a ordem de
entrega, e vale registrar para quem for implementar não repetir o caminho:

```
CQCS          200   50 itens de RSS      ← fácil
Apólice       200   10 itens de RSS      ← fácil
Sonho Seguro  200   20 itens de RSS      ← fácil
BCB           200   API JSON de verdade  ← fácil
CVM / ANS     200   arquivos CSV         ← médio
SUSEP         200   327 KB de HTML SEM UM LINK  ← precisa navegador
DOU           200   idem                        ← precisa navegador
CNseg         404   sem RSS                     ← a investigar
```

**A imprensa setorial é a parte mais fácil, não a mais difícil.** SUSEP e DOU
— as fontes mais valiosas — são renderizadas no cliente e exigem navegador
completo. Isso inverte a ordem intuitiva de construção.

---

## FR-1 — Pautas

**FR-1.1** O vigia lê os feeds RSS de CQCS, Revista Apólice e Sonho Seguro
três vezes ao dia.

**FR-1.2** Cada item novo vira uma **pauta**: título, veículo de origem, link,
data de publicação, resumo quando o feed trouxer.

**FR-1.3** Pauta tem estado: `nova`, `lida`, `descartada`, `virou_materia`. A
transição é manual, feita por quem edita.

**FR-1.4** A deduplicação é pela **URL do item**, não pelo título: o mesmo
veículo republica com título ajustado, e veículos diferentes cobrem o mesmo
fato com títulos parecidos — o segundo caso é informação, não repetição.

**FR-1.5** A lista de pautas aparece no painel, ao lado da fila de revisão,
mostrando por padrão só as de estado `nova` com menos de sete dias. As demais
continuam na tabela e são alcançáveis por filtro — radar que acumula ruído
deixa de ser lido, mas apagar histórico de pauta é perder registro do que o
veículo viu e decidiu não cobrir.

**FR-1.6** Uma fonte que falhe **não derruba as outras**. O relatório da
execução diz qual falhou e por quê.

**CON-1** Nenhum texto de pauta vinda de veículo de imprensa pode alcançar o
gerador de matéria. Isto é verificável no código: o gerador recebe documento
de fonte primária, e o tipo da fonte é parte do contrato.

## FR-2 — Registro de execução

**FR-2.1** Cada execução grava uma linha **mesmo quando não acha nada e mesmo
quando falha**: quando rodou, quantos itens novos por fonte, e o erro de cada
fonte que tropeçou.

Derivar isso das datas em `pautas` não serve, e é exatamente o caso que
importa: execução que falhou e execução que rodou num dia calmo produzem o
mesmo vazio em `pautas` — nenhuma linha — e são coisas opostas.

**FR-2.2** O topo da lista de pautas diz quando foi a última execução e o que
falhou nela. Vigia que parou e ninguém percebeu é pior do que vigia nenhum:
cria a impressão de cobertura que não existe.

**FR-2.3** Execução sem nenhum item novo em **todas** as fontes é sinalizada
como suspeita. Pode ser dia calmo; também é como parecem três feeds que
mudaram de formato ao mesmo tempo — por exemplo, depois de uma atualização do
WordPress que os três usam.

## FR-3 — Onde roda

**FR-3.1** GitHub Actions, agendado três vezes por dia em horário de Brasília.

O repositório já está no GitHub; os minutos são gratuitos nesta escala; não há
teto de tempo de execução como na Vercel; o Playwright das etapas seguintes
roda sem contorno; os logs ficam visíveis; e desligar é desabilitar o
workflow.

**FR-3.2** O vigia escreve por HTTP, nunca direto no banco, e reusa a chave
`INGESTAO_TOKEN` que já existe. Um endereço novo, no mesmo padrão do que já
está em produção:

```
POST /api/vigia/execucao
{
  "achados": [ { "fonte": "cqcs", "tipoDeFonte": "imprensa",
                 "titulo": "...", "url": "...", "resumo": "...",
                 "publicadoEm": "..." } ],
  "falhas":  { "apolice": "HTTP 503" }
}
```

**A execução inteira vai numa chamada só**, e não uma por item. Três razões:
a linha de `vigia_execucoes` é gravada na mesma transação lógica que os
achados, então não existe execução sem registro; itens repetidos são
descartados pela unicidade da URL sem custo de ida e volta; e uma execução sem
achado nenhum ainda assim grava — que é o caso da FR-2.3.

Os segredos ficam nos Secrets do repositório. Não há um segundo caminho de
escrita no banco: o vigia tem exatamente a mesma superfície que o Astra.

**FR-3.3** A execução é disparável à mão (`workflow_dispatch`), para depurar
sem esperar o horário.

---

## NFR

**NFR-1** Nenhuma fonte nova exige mudança no núcleo: cada uma é um adaptador
com a mesma interface — recebe a última execução, devolve itens.

**NFR-2** A lógica testável mora em módulos puros sob `src/lib/vigia/`. A
suíte roda em `environment: node`; o que depende de rede fica na casca fina.

**NFR-3** O parse de cada feed é testado contra **amostra real capturada**,
não contra XML escrito à mão. Feed de WordPress tem CDATA, HTML no resumo,
data em formatos variados e namespaces — e é justamente isso que quebra.

**NFR-4** Custo de modelo na etapa 1: **zero**. Nenhuma chamada a LLM.

**NFR-5** O vigia nunca publica. Nem pode: a trava
`articles_guard_insert_sem_sessao` recusa, no banco, matéria publicada vinda
de fora do painel.

---

## Modelo de dados

Uma tabela nova. `circulares_susep` já existe, com `code` único, e será
reaproveitada na etapa 3 — foi desenhada para isso e nunca foi usada.

```sql
create table public.pautas (
  id            uuid primary key default gen_random_uuid(),
  fonte         text not null,           -- 'cqcs', 'apolice', 'sonho-seguro'
  tipo_de_fonte text not null,           -- 'imprensa' | 'primaria'
  titulo        text not null,
  url           text not null unique,    -- a chave de dedupe
  resumo        text,
  publicado_em  timestamptz,
  estado        text not null default 'nova'
                check (estado in ('nova','lida','descartada','virou_materia')),
  article_id    uuid references public.articles(id) on delete set null,
  criado_em     timestamptz not null default now()
);
```

`tipo_de_fonte` não é decoração: é o campo que torna a CON-1 verificável. Um
adaptador de imprensa só produz `'imprensa'`, e o gerador de matéria das
etapas seguintes recusa qualquer coisa que não seja `'primaria'`.

```sql
create table public.vigia_execucoes (
  id           uuid primary key default gen_random_uuid(),
  comecou_em   timestamptz not null default now(),
  terminou_em  timestamptz,
  -- {"cqcs": 3, "apolice": 0, "sonho-seguro": 1}
  achados      jsonb not null default '{}'::jsonb,
  -- {"cqcs": "HTTP 503"} — vazio quando tudo correu bem
  falhas       jsonb not null default '{}'::jsonb
);
```

Ambas as tabelas com RLS ligada e leitura só para admin, no padrão de
`ingestao_recebidas`. A escrita é do vigia, pela API de ingestão — nenhum
papel do navegador escreve nelas.

---

## Etapas

Esta spec descreve o subsistema inteiro. **O plano de implementação cobre só
a etapa 1** — as seguintes ganham planos próprios, depois que a primeira
estiver rodando de verdade.

| Etapa | Entrega | Navegador | Custo de modelo |
|---|---|---|---|
| **1** | Pautas por RSS, tela no painel, relatório de execução | não | zero |
| 2 | Matéria de número a partir de BCB, CVM e ANS | não | por matéria |
| 3 | Matéria de documento a partir de SUSEP e DOU | Playwright | por matéria |

A ordem não é conveniência. A etapa 1 prova que o agendamento, a
deduplicação, o relatório e a tela funcionam — com a parte mais barata e mais
fácil de depurar. Construir a redação automática em cima de um vigia que
nunca rodou seria empilhar o caro sobre o não verificado.

---

## Riscos, ditos agora

**O feed muda e ninguém percebe.** É o modo de falha mais provável, e o mais
silencioso: o vigia roda, não acha nada, e parece que o mercado está calmo. A
FR-2.2 existe por isso — a última execução fica à vista, com a contagem por
fonte.

**A lista de pautas vira ruído.** Três veículos publicam muito, e a maior
parte não interessa. A FR-1.5 poda por idade; se ainda assim incomodar, o
próximo passo é filtro por palavra-chave, não classificação por modelo.

**CNseg não tem RSS.** Fica fora da etapa 1. Investigar na etapa 3, junto com
SUSEP e DOU, que precisam do mesmo navegador.

**A decisão editorial sobre assinatura permanece.** Matérias geradas nas
etapas 2 e 3 assinam "Da Redação", por escolha do dono, registrada na spec da
ingestão. A procedência fica em `ingestao_recebidas`.
