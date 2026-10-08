# A redação automática — da pauta à matéria em revisão

**Data:** 2026-10-08
**Antecede:** o vigia de fontes (`2026-09-29-vigia-de-fontes-design.md`), em produção
**Depende de:** a ingestão por API (`docs/integracao/astra.md`), em produção

---

## Por que isto existe

O vigia traz cerca de trinta pautas por dia e já acumulou noventa e oito. O
portal tem duas matérias publicadas, ambas de teste. Entre o radar e o site
existe hoje apenas trabalho humano que não está sendo feito.

O dono do veículo quer abrir o painel de manhã e encontrar matérias prontas
para **aprovar ou recusar**, sem redigir cada uma. Ele continua escrevendo à
mão quando quiser, e continua sendo o único que publica.

## A decisão que define a arquitetura

Perguntado sobre usar cobertura de concorrente, o dono respondeu, nas duas
conversas, com a mesma frase: *"não quero plágio, apenas inspiração"*. E
acrescentou agora: *"se for de concorrente sempre a gente pode deixar no final
do texto algum tipo de opção para citar fonte"*.

A regra não mudou. O que mudou foi **como ela se realiza**.

No vigia, `tipo_de_fonte` respondia *"isto pode virar matéria?"*, e a resposta
para imprensa era não. Agora ele responde **"esta matéria precisa citar a
origem?"**, e a resposta para imprensa é sim, obrigatoriamente.

Isso é mais forte do que parece, e é o eixo do desenho: **a atribuição deixa
de ser instrução de prompt e vira invariante de banco.** Um modelo esquece
numa manhã ruim; uma `check constraint` não esquece. Matéria marcada como
derivada sem endereço de origem é recusada pelo Postgres, não pela boa
vontade do gerador.

## O que foi apurado antes de desenhar

**O portal já tolera matéria sem capa.** `articles-db.ts:58` faz
`linha.cover_url ?? photo(linha.slug, 1200, 800)`, e a rota `/preview` gera um
PNG determinístico a partir do slug. Uma matéria publicada hoje está sem capa
e a página renderiza. Capa é acabamento, não bloqueio.

**A trava contra publicação automática já existe.** O gatilho
`guard_insert_sem_sessao` recusa, no banco, matéria publicada inserida com a
chave de serviço. Nada que este subsistema escreva pode nascer publicado,
mesmo que o código erre.

**A porta de escrita já existe e está provada.** `/api/ingestao/materias`
passou 12 de 12 verificações contra produção. O gerador usa essa porta, não
uma nova.

**As regras editoriais já estão escritas.** O dono mantém uma skill de
editor-chefe com hierarquia de fontes, critério de seleção e formato de
entrega. Este subsistema implementa aquelas regras; não inventa outras.

---

## FR-1 — Classificação

**FR-1.1** Antes de escrever, o gerador classifica cada pauta em um de dois
tipos:

| Tipo | O que é | Precisa citar? |
|---|---|---|
| `release` | Comunicado, transação de mercado, nomeação, lançamento. Veio do próprio interessado e todos os veículos receberam igual. | Não |
| `apuracao` | Número, acusação, comparação, consequência disputada. Alguém apurou. | Sim, se a fonte primária não for encontrada |

**FR-1.2** A distinção não é estética. Release não tem dono: a origem é a
empresa, não o veículo que publicou primeiro. A própria skill do dono já diz
que *"dois veículos reproduzindo o mesmo release são uma única origem"*.
Matéria de apuração tem dono, e é por isso que ela precisa de crédito quando
derivada.

**FR-1.3** Na dúvida, o gerador classifica como `apuracao`. Errar para o lado
do crédito custa uma linha de texto; errar para o outro lado custa a regra.

## FR-2 — Procedência

**FR-2.1** Toda matéria criada por este subsistema grava sua procedência:

| `origem` | Significa |
|---|---|
| `release` | Comunicado reescrito. Sem crédito a veículo. |
| `primaria` | Escrita a partir de documento oficial encontrado pelo gerador. |
| `derivada` | Partiu de cobertura de terceiro e a fonte primária não foi encontrada. **Exige** endereço de origem. |
| `null` | Escrita por uma pessoa. O caminho manual não muda. |

**FR-2.2** `origem = 'derivada'` sem `fonte_original_url` é recusado pelo
banco, por `check constraint`. É o ponto onde a promessa do dono vira código.

**FR-2.3** O portal mostra o crédito ao final do texto quando
`fonte_original_url` existe, em todas as matérias que o tiverem — inclusive
nas escritas à mão, se alguém preencher o campo.

## FR-3 — A marca de checagem

**FR-3.1** Matéria com `origem = 'derivada'` nasce com
`precisa_checagem = true`.

**FR-3.2** A marca aparece **na fila do painel e dentro do editor**, não num
comentário escondido. Quem aprova precisa ver antes de clicar.

**FR-3.3** Publicar matéria com `precisa_checagem = true` exige uma
confirmação a mais. Numa manhã corrida, cinco matérias marcadas e um botão de
aprovar viram cinco aprovações — a marca só protege se fizer parar.

**FR-3.4** Desmarcar é ação humana explícita, disponível no editor. Quem
checou assume a checagem.

## FR-4 — Seleção e volume

**FR-4.1** O gerador escreve **no máximo dez matérias por execução**, e o
número alvo é cinco. Teto no código, não no prompt.

**FR-4.2** A seleção usa os critérios que a skill do dono já define: novidade
verificável, consequência concreta, utilidade para o corretor, qualidade de
evidência, diversidade de editoria e de empresa.

**FR-4.3** Pautas que reproduzem o mesmo comunicado são agrupadas e geram
**uma** matéria. Três veículos publicando o mesmo release são um fato, não
três.

**FR-4.4** Pauta que virou matéria recebe `estado = 'virou_materia'` e
`article_id`, e sai da fila. O campo existe no banco desde o vigia e nunca foi
usado.

**FR-4.5** Pauta não selecionada **permanece `nova`**. A tela de pautas
continua sendo o radar onde o dono escolhe o que merece apuração humana.

**FR-4.6** A pauta é **reservada antes** de o gerador escrever, não depois.

Sem isso existe um buraco: se a matéria for criada e a marcação da pauta
falhar — rede, 500, execução interrompida — a execução seguinte escreve a
mesma pauta de novo. O dedupe por conteúdo da rota de ingestão não salva,
porque texto gerado nunca sai idêntico duas vezes, e a fila de revisão
recebe duas versões do mesmo fato sem ninguém entender por quê.

A reserva usa um estado próprio, `em_producao`, gravado antes da chamada ao
modelo. Pauta reservada há mais de uma hora volta para `nova`: execução
morta no meio não pode prender a pauta para sempre.

## FR-5 — Fonte primária

**FR-5.1** Para pauta classificada como `apuracao`, o gerador tenta encontrar
o documento original: circular, resolução, balanço, comunicado oficial.

**FR-5.2** A busca tem teto: no máximo **duas buscas e três páginas abertas**
por pauta. Buscar indefinidamente queima orçamento sem garantia de achar, e
o teto precisa ser um número no código, não um "pouco" no prompt.

**FR-5.3** Encontrando, escreve a partir do documento e grava
`origem = 'primaria'`. Não encontrando, escreve a partir do que tem, grava
`origem = 'derivada'`, o endereço de origem e a marca de checagem.

**FR-5.4** O gerador **nunca** copia trecho literal da cobertura de terceiro.
A instrução existe no prompt; a verificação possível é de tamanho e de
estrutura, não de semântica, e isto fica dito: nenhum teste automatizado
prova ausência de plágio. O que o sistema garante é a atribuição.

## FR-6 — Formato

**FR-6.1** Texto curto, na mediana do que uma redação pratica:

| Tipo | Palavras |
|---|---|
| `release` | 180 a 300 |
| `apuracao` | 300 a 450 |

**FR-6.2** O corpo usa apenas o que o editor do painel abre: parágrafos,
subtítulos, listas, citações e links. Imagem e tabela são recusadas pela rota
de ingestão com 422 — o gerador não deve produzi-las.

**FR-6.3** Assinatura "Da Redação", como toda matéria que entra pela API. É
decisão editorial já tomada e registrada.

## FR-7 — Capa

**FR-7.1** Cada editoria tem um pequeno conjunto de imagens próprias,
servidas do projeto. O gerador escolhe uma pela editoria da matéria.

**FR-7.2** Sem conjunto para a editoria, a matéria fica sem `cover_url` e o
portal usa a imagem gerada que já existe. Nenhuma matéria quebra por falta de
foto.

**FR-7.3** **Não se gera fotografia por IA.** A skill do dono diz *"não
fabricar fotografia documental"*, e imagem sintética de um fato real é
exatamente isso. Também não se reaproveita foto de terceiro: a mesma skill
proíbe.

**FR-7.4** O dono troca a capa no editor antes de aprovar. O campo de upload
já existe.

## FR-8 — Execução

**FR-8.1** GitHub Actions, uma vez ao dia, depois da primeira leitura do
vigia. Mesma infraestrutura que já roda três vezes por dia com sucesso.

**FR-8.2** A escrita é pela rota de ingestão existente, com a chave que já
existe. Nenhuma porta nova no banco.

**FR-8.3** Uma pauta que falha não derruba as outras. Cada uma é tentada
isoladamente.

**FR-8.4** A execução grava uma linha de registro — quantas tentou, quantas
escreveu, quanto custou, e o erro de cada uma que falhou — pelo mesmo motivo
que `vigia_execucoes` existe: execução que falhou e dia sem pauta boa
produzem o mesmo vazio, e são coisas opostas.

**FR-8.5** Disparável à mão (`workflow_dispatch`), para depurar sem esperar o
horário.

---

## NFR

**NFR-1** O custo por execução tem teto de **US$ 1,00**, contado a partir do
uso que a própria API reporta. Atingido o teto, a execução para onde está,
grava o que já escreveu e registra o motivo. Orçamento que só se descobre na
fatura não é orçamento. Uma execução normal de cinco matérias deve ficar
bem abaixo disso; o teto existe para o laço que deu errado, não para o dia
caro.

**NFR-2** A lógica testável mora em módulos puros sob `src/lib/redacao/`. A
chamada ao modelo fica na casca fina, como em `vigia.mjs`.

**NFR-3** O que é testável sem modelo é testado sem modelo: a escolha de
rota a partir da classificação, o agrupamento de pautas repetidas, o teto de
seleção, o mapeamento para o contrato da ingestão, a escolha de capa.

**NFR-4** Nenhuma matéria nasce publicada. Garantido em três camadas: a rota
grava `in_review`, o gatilho do banco recusa publicada sem sessão, e o painel
exige ação humana.

**NFR-5** Chave de modelo mora nos Secrets do repositório, como a chave da
ingestão. O gerador não ganha acesso ao banco: ele fala HTTP com a rota.

---

## Modelo de dados

Três colunas em `articles`, e a restrição que as amarra:

```sql
alter table public.articles
  add column if not exists origem              text,
  add column if not exists fonte_original_url  text,
  add column if not exists fonte_original_nome text,
  add column if not exists precisa_checagem    boolean not null default false;

alter table public.articles
  add constraint articles_origem_valida
    check (origem is null or origem in ('release', 'primaria', 'derivada'));

-- O ponto onde "inspiração, não plágio" vira invariante de banco.
alter table public.articles
  add constraint articles_derivada_tem_fonte
    check (origem <> 'derivada' or fonte_original_url is not null);
```

Um estado a mais em `pautas`, para a reserva da FR-4.6. A coluna tem `check
constraint` desde o vigia, então o valor novo precisa entrar nela:

```sql
alter table public.pautas drop constraint if exists pautas_estado_check;
alter table public.pautas
  add constraint pautas_estado_check
    check (estado in ('nova', 'em_producao', 'lida', 'descartada', 'virou_materia'));
```

A tela de pautas filtra por `nova`, então `em_producao` não aparece na lista
— que é o comportamento certo: pauta em produção não é pauta à espera de
decisão. O painel ainda não tem filtro para os outros estados; isso já está
registrado como dívida desde o vigia.

Uma tabela para o registro de execução, no molde de `vigia_execucoes`:

```sql
create table public.redacao_execucoes (
  id           uuid primary key default gen_random_uuid(),
  comecou_em   timestamptz not null default now(),
  -- {"tentadas": 8, "escritas": 5, "release": 3, "primaria": 1, "derivada": 1}
  resultado    jsonb not null default '{}'::jsonb,
  -- {"<id da pauta>": "não foi possível ler a página"}
  falhas       jsonb not null default '{}'::jsonb,
  custo_usd    numeric(10,4)
);
```

`origem` e as colunas de fonte entram no grant público de leitura: o crédito
aparece na página, então é dado público. `precisa_checagem` **não** entra —
é informação de redação, e dizer ao leitor que uma matéria publicada não foi
checada é pior do que não publicá-la.

---

## Fluxo

```
pautas novas (≈30/dia)
      │
      ├─ agrupa reproduções do mesmo comunicado
      ├─ seleciona até 10, alvo 5
      │
      └─ para cada uma:
            │
            ├─ RESERVA a pauta: estado = 'em_producao'
            │  (antes de gastar modelo; sem isso, falha no meio
            │   faz a execução seguinte escrever a mesma pauta)
            │
            ├─ classifica
            │
            ├── release
            │     └─ escreve 180–300 palavras
            │        origem = 'release', sem crédito
            │
            └── apuracao
                  ├─ procura a fonte primária (tentativas limitadas)
                  │
                  ├── achou  → escreve a partir dela
                  │            origem = 'primaria'
                  │
                  └── não achou → escreve com o que tem
                                  origem = 'derivada'
                                  fonte_original_url obrigatório
                                  precisa_checagem = true
            │
            ├─ escolhe capa pela editoria
            ├─ POST /api/ingestao/materias  →  "Em revisão"
            └─ marca a pauta: virou_materia + article_id

      └─ grava a execução: tentadas, escritas, falhas, custo
```

---

## Entregas

| Etapa | O que entrega | Modelo? |
|---|---|---|
| **1** | Colunas, restrições, crédito na página, marca no painel | não |
| **2** | Classificação, seleção, agrupamento, mapeamento — tudo puro e testado | não |
| **3** | O gerador: chamada ao modelo, busca de fonte primária, script e agendamento | sim |
| **4** | Conjunto de capas por editoria | não |

A ordem não é conveniência. A etapa 1 torna a procedência representável antes
de existir quem a produza, e é a parte que não pode estar errada: é ela que
carrega a regra do dono. A etapa 2 constrói e prova tudo que decide, sem
gastar um centavo de modelo. Só a 3 gasta — e chega com as decisões já
verificadas.

---

## Riscos, ditos agora

**O texto pode não prestar.** É o risco principal e nenhuma arquitetura o
resolve. Por isso a etapa 3 começa com execução manual e leitura das cinco
primeiras antes de agendar. Agendar um gerador cujo produto ninguém leu é
construir esteira para mercadoria não inspecionada.

**A fila de revisão vira ruído.** Cinco por dia são trinta e cinco por
semana. Se o dono não triar, a fila acumula e deixa de ser lida — o mesmo
modo de falha que a tela de pautas tem. O teto de dez existe por isso; se
ainda assim incomodar, o próximo passo é reduzir o alvo, não aumentar.

**A marca de checagem vira carimbo.** Se quase toda matéria nascer marcada, a
marca perde sentido e as pessoas aprovam no automático. A primeira execução
real mede isso: se a maioria sair `derivada`, a busca de fonte primária está
fraca e o remédio é melhorá-la, não baixar a régua.

**Reescrever continua sendo derivar.** Atribuição resolve o crédito, não a
originalidade. Um veículo cuja maior parte sai de `derivada` é um espelho dos
concorrentes, com nota de rodapé. O registro de execução conta essa proporção
a cada dia, de propósito, para que a escolha permaneça visível.

**Custo silencioso.** O teto da NFR-1 existe porque um laço de busca mal
fechado gasta em uma noite o crédito de um mês.
