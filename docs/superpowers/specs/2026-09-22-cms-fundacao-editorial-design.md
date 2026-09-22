# CMS SegReport — Fundação administrativa e editorial

**Sub-projeto 3a** · 22 de setembro de 2026

---

## Por que este sub-projeto existe

O portal SegReport renderiza hoje a partir de fixtures TypeScript em `src/lib/data/`.
Publicar uma matéria exige editar código e fazer deploy. Este sub-projeto substitui
isso por um painel administrativo próprio sobre o Supabase, e é pré-requisito dos
outros três: ad server (3b), gestão de conteúdo do Hub (3c) e cobrança (3d).

O Sanity.io foi removido do projeto no commit `76e9258`. Não há CMS em operação.

---

## Decisões que sustentam o desenho

| Decisão | Escolha | Consequência principal |
|---|---|---|
| Armazenamento do texto | Rich text estruturado em JSON | Permite blocos próprios com dado do Hub dentro da matéria; exige renderizador próprio |
| Autenticação | Convite por e-mail com link mágico | Sem senha para recuperar, forçar ou vazar |
| Autoridade de publicação | Colunista envia, admin publica | Máquina de estados com revisão; RLS bloqueia escrita de `status` pelo colunista |
| Casca do painel | Barra lateral escura, área de trabalho clara | Comporta seções futuras; separa ferramenta de conteúdo |
| Editor | Metadados no trilho direito, sempre visíveis | Categoria e capa não são esquecidas |
| Biblioteca de edição | Tiptap (ProseMirror) | API de nó customizado viável para os três blocos próprios |

---

## Arquitetura

### Fronteira de confiança

O painel vive em `src/app/(admin)/admin/*`, dentro da mesma aplicação Next.js.
Toda escrita passa por **Server Actions** usando o cliente Supabase com a sessão do
usuário — a RLS do Postgres é a autoridade final.

A chave `service_role` ignora toda a RLS. Ela é usada em **exatamente uma**
operação: convidar usuário (`auth.admin.inviteUserByEmail`), que precisa criar conta
alheia. Fica isolada em `src/lib/supabase/admin.ts`, com um comentário explicando a
restrição, e nunca é importada por componente de página.

Consequência desejada: uma policy mal escrita aparece como "não consigo salvar", e
não como "o colunista publicou sozinho".

### Papéis

`profiles.role` assume três valores:

- `admin` — publica, gerencia colunistas, mídia, anúncios e Hub
- `columnist` — escreve e envia as próprias colunas; não publica
- `reader` — assinante; nenhum acesso ao painel

Funções auxiliares no Postgres, usadas por todas as policies:

```sql
create function public.current_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'admin', false)
$$;
```

`security definer` com `search_path` fixo é obrigatório: sem ele, a própria policy de
`profiles` impediria a função de ler a linha de que precisa.

### Ligação entre conta e assinatura pública

São duas coisas distintas e o projeto já tem as duas tabelas:

- `profiles` — a conta que entra no sistema, ligada a `auth.users`
- `authors` — o perfil público que assina a matéria: nome, cargo, biografia, foto

Um colunista precisa dos dois. A ligação ganha uma coluna nova:

```sql
alter table public.authors
  add column profile_id uuid unique references public.profiles(id) on delete set null;

create function public.current_author_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select id from public.authors where profile_id = auth.uid()
$$;
```

`profile_id` é anulável de propósito: a redação assina matéria como "Redação
SegReport", que é um autor sem conta. E `on delete set null` preserva a autoria
histórica quando uma conta é removida — a matéria continua assinada, o acesso é que
acaba.

---

## Máquina de estados da matéria

```
rascunho ──enviar──▶ em revisão ──aprovar──▶ agendada ──(pg_cron)──▶ publicada
    ▲                     │                       │                      │
    └─────devolver────────┘                       └───────────┬──────────┘
                                                              ▼
                                                          arquivada
```

`articles.status` passa a aceitar: `draft`, `in_review`, `scheduled`, `published`,
`archived`. A migração converte o `check` atual, que só conhece três valores.

### Quem pode fazer o quê

| Transição | admin | columnist |
|---|---|---|
| criar rascunho | sim | sim (autor = ele próprio) |
| editar `draft` / `in_review` | qualquer uma | apenas as próprias |
| `draft` → `in_review` | sim | sim |
| `in_review` → `draft` (devolver) | sim | não |
| → `scheduled` / `published` | sim | **não** |
| → `archived` | sim | não |
| editar matéria já publicada | sim | não |

A restrição do colunista é aplicada por policy de `UPDATE` com `with check`, não por
condicional na interface:

```sql
create policy articles_update_columnist on public.articles for update
  to authenticated
  using (
    author_id = public.current_author_id()
    and status in ('draft', 'in_review')
  )
  with check (
    author_id = public.current_author_id()
    and status in ('draft', 'in_review')
  );
```

O `with check` é a metade que importa: sem ele o colunista poderia ler a própria
matéria em rascunho e gravá-la de volta com `status = 'published'`.

---

## Modelo de conteúdo

### Documento de blocos

`articles.content_json jsonb` guarda o documento no formato do Tiptap. Tipos de bloco:

**Padrão:** parágrafo, subtítulo (níveis 2 e 3), citação, lista ordenada e não
ordenada, tabela, imagem com legenda e crédito, incorporação de vídeo, separador.

**Próprios do SegReport:**

| Bloco | Atributos | Renderização |
|---|---|---|
| `indicatorChart` | `indicatorKey`, `months` | Busca a série e desenha o gráfico de área já existente |
| `proBox` | conteúdo interno | Trecho restrito dentro de matéria aberta; corte aplicado na consulta |
| `relatedArticles` | lista de `slug` | Curadoria manual de relacionadas |

### Texto derivado para busca

`articles.content_text text` recebe, a cada salvamento, o texto puro extraído dos
blocos. A extração acontece na Server Action, não em gatilho do banco — a lógica de
percorrer o documento pertence ao mesmo lugar que define os tipos de bloco.

Sem essa coluna, procurar uma palavra dentro do artigo exigiria varrer JSON, que o
Postgres resolve mal e sem índice de texto.

### Renderizador

`src/components/article/BlockRenderer.tsx` mapeia tipo de bloco para componente React.

**Bloco de tipo desconhecido é ignorado e registrado, nunca derruba a página.** É o
que permite publicar um bloco novo antes que todo o código de renderização conheça
ele, e manter matéria antiga funcionando depois de uma remoção.

### O bloco `proBox` e o paywall em página estática

Aqui existe um conflito que precisa ser resolvido explicitamente, porque o desenho
anterior não o previu.

As páginas de matéria são **geradas estaticamente** — decisão tomada para preservar
SEO e velocidade. Mas uma página estática tem uma versão só. Se o corte do conteúdo
restrito acontecesse na geração, o assinante PRO receberia a mesma versão cortada do
leitor gratuito, porque o HTML já estaria pronto no disco.

A solução segue exatamente o padrão já escolhido para anúncios: **casca estática,
continuação buscada no cliente.**

```
Página estática traz o documento até o proBox, com o bloco de conversão no lugar
        ↓  (leitor autenticado)
GET /api/materia/{slug}/restrito
        ↓  servidor: lê o plano pela sessão → sem acesso? devolve 403
        ↓  devolve apenas os blocos internos do proBox
Continuação substitui o bloco de conversão
```

Três consequências, todas desejadas:

- O texto restrito **nunca** entra no HTML estático, então não existe em cache de CDN,
  não é indexado e não aparece no código-fonte.
- O Google indexa a abertura real da matéria, que é o que traz leitor novo.
- Um único modelo mental no projeto inteiro: conteúdo que depende de quem pede é
  sempre buscado depois, nunca gerado antes.

A mesma rota serve matérias com `is_premium = true`, onde o corte é o artigo inteiro
a partir do primeiro parágrafo.

---

## Mídia

Bucket `media` no Supabase Storage, privado, com leitura pública via URL assinada de
validade longa para os arquivos publicados.

Upload por URL assinada gerada em Server Action — o arquivo vai do navegador direto
ao Storage, sem passar pelo servidor Next.

```sql
create table public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  alt          text not null check (length(trim(alt)) >= 3),
  credit       text,
  width        int,
  height       int,
  bytes        int,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
```

O `check` sobre `alt` é deliberado: **texto alternativo é obrigatório no momento do
upload**, garantido pelo banco. Acessibilidade cobrada na criação custa cinco
segundos; cobrada numa auditoria futura vira mutirão em centenas de imagens.

Limites: 8 MB por arquivo, tipos `image/jpeg`, `image/png`, `image/webp`. Conversão
para WebP na entrada, mantendo o original.

---

## Alterações no banco

### Tabelas alteradas

**`profiles`** — `role text not null default 'reader' check (role in ('admin','columnist','reader'))`, `invited_at timestamptz`

**`articles`** — adiciona `content_json jsonb`, `content_text text`, `standfirst text`,
`scheduled_for timestamptz`, `seo_title text`, `seo_description text`,
`updated_by uuid references public.profiles(id)`. Amplia o `check` de `status`.

A coluna `content text` existente é mantida durante a migração e removida numa
migração posterior, depois que todo conteúdo estiver em `content_json`.

### Tabelas novas

**`tags`** — `id`, `slug` único, `label`
**`article_tags`** — chave composta `(article_id, tag_id)`
**`media_assets`** — acima

### Índices

```sql
create index articles_status_published_idx
  on public.articles (status, published_at desc) where status = 'published';
create index articles_author_idx on public.articles (author_id);
create index articles_scheduled_idx
  on public.articles (scheduled_for) where status = 'scheduled';
create index articles_search_idx
  on public.articles using gin (to_tsvector('portuguese', coalesce(content_text, '')));
```

---

## Publicação agendada

`pg_cron` roda a cada minuto dentro do próprio Supabase:

```sql
select cron.schedule('publicar-agendadas', '* * * * *', $$
  update public.articles
     set status = 'published', published_at = scheduled_for
   where status = 'scheduled' and scheduled_for <= now()
$$);
```

Escolhido em vez de agendador externo porque roda na mesma transação e no mesmo
banco, sem depender de outro serviço estar de pé. A mesma extensão será reaproveitada
pela agregação de métricas do ad server (3b).

O painel exibe a marca da última execução; se a rotina parar, o problema aparece na
tela antes de alguém notar pela matéria que não saiu.

---

## Rotas do painel

```
/admin                       redireciona para /admin/materias
/admin/materias              lista com filtros por status, autor e categoria
/admin/materias/nova         editor em branco
/admin/materias/[id]         editor
/admin/colunistas            lista e convite
/admin/colunistas/[id]       perfil público e escopo
/admin/midia                 biblioteca com busca por texto alternativo
/admin/ajustes               categorias e tags
```

Route group `(admin)` com layout próprio: barra lateral escura, área de trabalho
clara. Todas as rotas renderizam por requisição — conteúdo depende de quem pede.

O colunista vê apenas `/admin/materias`, filtrada às suas, e `/admin/midia`. O layout
esconde o que ele não pode acessar, e a RLS garante o resto.

**A biblioteca de mídia é compartilhada:** o colunista enxerga e reutiliza todas as
imagens, não só as que subiu. Numa redação pequena, obrigar cada um a ressubir a foto
do mesmo evento gera duplicata e desperdiça armazenamento. Ele pode subir e usar;
apagar é só do admin, porque remover um arquivo em uso quebra matéria de terceiro.

---

## Tratamento de erro

1. **Salvamento nunca perde texto.** Rascunho automático em `localStorage` a cada
   alteração; se a Server Action falhar, o editor mantém o conteúdo e mostra a falha
   com opção de tentar de novo.
2. **Conflito de edição simultânea.** `articles.updated_at` viaja com o formulário; se
   mudou no servidor, a gravação é recusada e a interface mostra quem alterou.
   Sem mesclagem automática — em texto editorial, mesclar às cegas é pior que avisar.
3. **Upload que falha no meio** não deixa linha órfã: a linha em `media_assets` só é
   criada depois de o Storage confirmar.
4. **Bloco desconhecido** é ignorado no render e registrado.

---

## Testes

### Prioridade absoluta: RLS

Executados contra o banco real com três sessões autenticadas distintas.

| Teste | Afirmação |
|---|---|
| Colunista grava `status = 'published'` | Erro do banco; linha inalterada |
| Colunista grava `status = 'scheduled'` | Erro do banco |
| Colunista atualiza matéria de outro autor | Zero linhas afetadas |
| Colunista lê matéria de outro autor em rascunho | Zero linhas |
| Leitor lê qualquer rascunho | Zero linhas |
| Leitor grava em `articles` | Erro do banco |
| Anônimo lê matéria publicada | Sucesso |
| Colunista muda o próprio `profiles.role` para `admin` | Erro do banco |

O último é o que fecha a porta: sem ele, todas as outras policies são contornáveis.

### Transformações puras

Extração de `content_text` a partir do documento; ida e volta do documento
(JSON → editor → JSON preserva a estrutura); substituição do `proBox` para leitor sem
acesso; cálculo de tempo de leitura.

### Ponta a ponta

Convidar colunista → ele entra pelo link → escreve → envia → admin devolve → colunista
corrige → envia → admin agenda → `pg_cron` publica → matéria aparece no portal.

---

## Fora de escopo, deliberadamente

- **Histórico de versões da matéria.** Com um admin e poucos colunistas, `updated_by`
  e `updated_at` respondem "quem mexeu por último". Entra depois sem refazer o modelo.
- **Edição colaborativa em tempo real.** Uma pessoa por matéria; a detecção de
  conflito cobre o caso raro.
- **Fluxo de aprovação com múltiplos níveis.** Uma etapa de revisão, não uma cadeia.
- **Tradução e versões por idioma.**
- **Busca full-text na interface pública.** O índice é criado agora; a tela de busca
  do portal é trabalho separado.

---

## Dependências e ordem

1. Migração de esquema e funções de RLS
2. Autenticação por link mágico e convite
3. Casca do painel com barra lateral e controle de papel
4. **Os três blocos próprios do Tiptap** — antes das telas de listagem
5. Editor completo com trilho de metadados
6. Biblioteca de mídia
7. Listagem, filtros e fila de revisão
8. Gestão de colunistas
9. `pg_cron` de publicação agendada
10. Troca de `src/lib/data/` de fixtures para consultas ao Supabase

O passo 4 vem antes do 5 de propósito: os nós customizados são a parte mais incerta
do sub-projeto. Se a API do Tiptap for pior que o esperado para o bloco de gráfico,
é melhor descobrir na primeira semana do que na sexta, com as telas de listagem já
construídas em cima de uma premissa errada.

---

## Pronto quando

Você convida um colunista por e-mail, ele entra sem senha, escreve uma coluna com um
gráfico de indicador embutido, envia para revisão; você lê, agenda para as 7h do dia
seguinte, e a matéria aparece no portal no horário — sem ninguém tocar em código,
sem deploy, e sem que o colunista consiga publicar nada por conta própria, nem mesmo
chamando a API diretamente.
