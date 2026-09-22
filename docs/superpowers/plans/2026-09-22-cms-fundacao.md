# CMS SegReport — Fundação (banco, RLS, autenticação e painel)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um painel administrativo em que admin e colunista entram por link mágico e no qual o **banco de dados**, não a interface, decide quem pode fazer o quê.

**Architecture:** Migrações no Postgres do Supabase definem papéis, a máquina de estados da matéria e as policies de RLS. Uma bateria de testes conecta direto ao Postgres assumindo a identidade de cada papel e prova as policies. Sobre essa base, o Next.js monta a autenticação por link mágico e a casca do painel com barra lateral.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, TypeScript, Tailwind v4, Supabase (Postgres 17 + Auth), Vitest, node-postgres.

**Spec:** `docs/superpowers/specs/2026-09-22-cms-fundacao-editorial-design.md`

## Global Constraints

- **Next.js 16.2.9.** `params` e `searchParams` são `Promise` e precisam de `await`. Existem os helpers globais `PageProps<'/rota'>` e `LayoutProps<'/rota'>`. Middleware chama-se `proxy.ts`. Antes de escrever código de framework, ler o guia correspondente em `node_modules/next/dist/docs/01-app/` — exigência do `AGENTS.md` do repositório.
- **Imports absolutos** via `@/*`, que aponta para `src/*`.
- **Todo texto de interface em português do Brasil**, com acentuação correta.
- **Tokens de design apenas.** Cores pelas classes do tema (`forest-800`, `lime-400`, `ink-3`…), nunca hexadecimal solto no componente.
- **Peso tipográfico:** 400 corpo, 500 navegação e metadados, 600 rótulos e botões, 700 só em texto de 18px para cima. Nunca `font-extrabold`.
- **Lima nunca é texto sobre fundo claro** — contraste 1,25:1. Lima é superfície, ou texto sobre verde-escuro.
- **A chave `service_role` ignora toda a RLS.** Ela só pode ser importada por `src/lib/supabase/admin.ts` e usada na operação de convite.
- **Migrações são imutáveis depois de aplicadas.** Correção vira migração nova, nunca edição da anterior.
- Rodar `npm run build` **com o `next dev` no ar** corrompe o diretório `.next`. Parar o dev antes de buildar.

---

## Pré-requisito: um banco de testes

Os testes de RLS precisam de um Postgres que **não seja o de produção**. `docker` não está instalado nesta máquina, então `supabase start` não é uma opção hoje.

Dois caminhos. Escolha um antes da Task 1 e registre em `.env.test`:

**Caminho A — Docker Desktop (recomendado).** Instale o Docker Desktop, e então `npx supabase start` sobe o stack local. Banco descartável, sem rede, rápido, e a string de conexão é `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

**Caminho B — projeto Supabase separado.** Crie um segundo projeto gratuito no painel do Supabase, exclusivo para testes. Copie a string de conexão direta (Settings → Database → Connection string → URI). Funciona sem Docker; custa latência de rede e exige que ninguém mais use aquele banco.

Em ambos os casos, as migrações são aplicadas com:

```bash
npx supabase db push --db-url "$TEST_DATABASE_URL"
```

**Nunca aponte `TEST_DATABASE_URL` para o banco de produção.** Os testes criam e apagam linhas.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/20260922000001_roles_and_helpers.sql` | Papéis, ligação `authors`↔`profiles`, funções auxiliares |
| `supabase/migrations/20260922000002_articles_cms.sql` | Colunas do CMS, máquina de estados, índices |
| `supabase/migrations/20260922000003_tags_and_media.sql` | `tags`, `article_tags`, `media_assets` |
| `supabase/migrations/20260922000004_cms_rls.sql` | Todas as policies do CMS |
| `tests/helpers/db.ts` | Conexão, transação com rollback, troca de identidade |
| `tests/helpers/seed.ts` | Usuários e conteúdo de teste com UUIDs fixos |
| `tests/rls/profiles.test.ts` | Escalada de papel é impossível |
| `tests/rls/articles.test.ts` | Máquina de estados e escopo do colunista |
| `tests/rls/media.test.ts` | Biblioteca compartilhada, apagar só do admin |
| `src/lib/supabase/admin.ts` | Cliente `service_role`, isolado |
| `src/lib/auth/session.ts` | Sessão, perfil, guardas de papel |
| `src/app/(portal)/login/actions.ts` | Envio do link mágico |
| `src/app/auth/confirm/route.ts` | Troca do código pela sessão |
| `src/app/(admin)/admin/layout.tsx` | Casca do painel |
| `src/components/admin/Sidebar.tsx` | Barra lateral escura |
| `src/app/(admin)/admin/colunistas/actions.ts` | Convite de colunista |

---

### Task 1: Ferramental de teste e prova de que a RLS está ativa

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `.env.test.example`
- Create: `tests/helpers/db.ts`
- Create: `tests/rls/baseline.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nada
- Produces: `pool: Pool`, `withRollback<T>(fn: (c: PoolClient) => Promise<T>): Promise<T>`, `actAs(c: PoolClient, userId: string | null): Promise<void>`

O truque central deste plano está aqui. Os testes **não** usam o cliente JavaScript do Supabase: conectam direto ao Postgres como o papel `postgres`, semeiam dados, e então assumem a identidade `authenticated` com um `sub` escolhido. `auth.uid()` lê de `request.jwt.claims`, então isso exercita as policies reais sem precisar de servidor de autenticação. Tudo roda dentro de uma transação que termina em `rollback`, o que dispensa limpeza.

- [ ] **Step 1: Instalar as dependências de teste**

```bash
npm install -D vitest@^3 pg@^8 @types/pg@^8 dotenv@^17
```

- [ ] **Step 2: Adicionar os scripts e a configuração**

Em `package.json`, dentro de `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"db:push:test": "supabase db push --db-url $TEST_DATABASE_URL"
```

Criar `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["dotenv/config"],
    // Testes de RLS compartilham o mesmo banco. Rodar em paralelo faria
    // transações concorrentes disputarem as mesmas linhas semeadas.
    fileParallelism: false,
    testTimeout: 20000,
    include: ["tests/**/*.test.ts"],
  },
});
```

Criar `.env.test.example`:

```
# Caminho A (Docker):  postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Caminho B (projeto de testes): copie a URI direta do painel do Supabase
# NUNCA aponte para o banco de produção — os testes escrevem e apagam.
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Em `.gitignore`, acrescentar a linha `.env.test`.

- [ ] **Step 3: Escrever o auxiliar de banco**

Criar `tests/helpers/db.ts`:

```ts
import { Pool, type PoolClient } from "pg";

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL ausente. Copie .env.test.example para .env.test e preencha."
  );
}

if (/supabase\.co/.test(connectionString) && process.env.ALLOW_REMOTE_TEST_DB !== "1") {
  // Proteção contra apontar os testes para produção por engano.
  console.warn(
    "TEST_DATABASE_URL aponta para um projeto remoto. Confirme que NÃO é produção e defina ALLOW_REMOTE_TEST_DB=1."
  );
}

export const pool = new Pool({ connectionString, max: 4 });

/**
 * Roda o callback dentro de uma transação que sempre termina em rollback.
 * Nenhum teste precisa limpar o que criou, e dois testes nunca enxergam
 * os dados um do outro.
 */
export async function withRollback<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  await client.query("begin");
  try {
    return await fn(client);
  } finally {
    await client.query("rollback");
    client.release();
  }
}

/**
 * Assume a identidade de um usuário para o resto da transação.
 *
 * `null` significa visitante anônimo. Depois desta chamada o papel do
 * Postgres deixa de ser `postgres`, que ignora RLS — então semeie os dados
 * ANTES de chamar esta função.
 */
export async function actAs(
  client: PoolClient,
  userId: string | null
): Promise<void> {
  if (userId === null) {
    await client.query("set local role anon");
    return;
  }
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
  await client.query("set local role authenticated");
}
```

- [ ] **Step 4: Escrever o teste de base, que deve falhar**

Criar `tests/rls/baseline.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { actAs, pool, withRollback } from "../helpers/db";

afterAll(async () => {
  await pool.end();
});

describe("base da RLS", () => {
  it("a conexão de teste funciona e enxerga o esquema do projeto", async () => {
    await withRollback(async (client) => {
      const result = await client.query(
        `select table_name from information_schema.tables
          where table_schema = 'public' and table_name = 'articles'`
      );
      expect(result.rowCount).toBe(1);
    });
  });

  it("trocar de identidade muda o papel efetivo do Postgres", async () => {
    await withRollback(async (client) => {
      await actAs(client, null);
      const result = await client.query("select current_user as papel");
      expect(result.rows[0].papel).toBe("anon");
    });
  });

  it("a função current_role ainda NÃO existe — alvo da Task 2", async () => {
    await withRollback(async (client) => {
      const result = await client.query(
        `select routine_name from information_schema.routines
          where routine_schema = 'public' and routine_name = 'current_role'`
      );
      expect(result.rowCount).toBe(1);
    });
  });
});
```

- [ ] **Step 5: Rodar e confirmar a falha esperada**

```bash
npm test -- tests/rls/baseline.test.ts
```

Esperado: os dois primeiros passam, provando que a conexão e a troca de identidade funcionam. **O terceiro falha**, porque `public.current_role()` ainda não existe — é o alvo da Task 2.

Se os dois primeiros falharem com erro de conexão, o `TEST_DATABASE_URL` está errado ou as migrações existentes não foram aplicadas — rode `npm run db:push:test` antes de seguir.

> **O que já existe no banco, conferido antes de escrever este plano.**
> `profiles` tem `id`, `full_name`, `avatar_url`, `plan` (`free`/`premium`), `role`
> (`reader`/`editor`/`admin`), `created_at`, `updated_at` — **não tem `email`**, que
> mora em `auth.users`. `authors` tem `id`, `name`, `bio`, `avatar_url`, `email`,
> `twitter_handle`, `created_at` — **não tem `slug`, `role` nem `profile_id`**. As
> policies de `articles` chamam-se `articles_select_free`, `articles_select_premium`
> e `articles_editor_all`. As Tasks 2 e 5 partem exatamente desse estado.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .env.test.example .gitignore tests/
git commit -m "test: ferramental de teste de RLS por conexão direta ao Postgres"
```

---

### Task 2: Papéis, ligação entre conta e autoria, funções auxiliares

**Files:**
- Create: `supabase/migrations/20260922000001_roles_and_helpers.sql`
- Create: `tests/helpers/seed.ts`
- Create: `tests/rls/profiles.test.ts`

**Interfaces:**
- Consumes: `withRollback`, `actAs` da Task 1
- Produces: SQL `public.current_role() → text`, `public.is_admin() → boolean`, `public.current_author_id() → uuid`; TS `seedUsers(client): Promise<SeedIds>` com `SeedIds = { adminId: string; columnistId: string; otherColumnistId: string; readerId: string; adminAuthorId: string; columnistAuthorId: string; otherAuthorId: string }`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/helpers/seed.ts`:

```ts
import type { PoolClient } from "pg";

export interface SeedIds {
  adminId: string;
  columnistId: string;
  otherColumnistId: string;
  readerId: string;
  adminAuthorId: string;
  columnistAuthorId: string;
  otherAuthorId: string;
}

const IDS: SeedIds = {
  adminId: "11111111-1111-4111-8111-111111111111",
  columnistId: "22222222-2222-4222-8222-222222222222",
  otherColumnistId: "33333333-3333-4333-8333-333333333333",
  readerId: "44444444-4444-4444-8444-444444444444",
  adminAuthorId: "aaaaaaaa-1111-4111-8111-111111111111",
  columnistAuthorId: "aaaaaaaa-2222-4222-8222-222222222222",
  otherAuthorId: "aaaaaaaa-3333-4333-8333-333333333333",
};

/**
 * Semeia contas e autores. Precisa rodar como `postgres`, ANTES de qualquer
 * chamada a actAs — depois da troca de papel, a RLS bloqueia estas escritas.
 */
export async function seedUsers(client: PoolClient): Promise<SeedIds> {
  const people: Array<[string, string, string]> = [
    [IDS.adminId, "admin@segreport.test", "admin"],
    [IDS.columnistId, "colunista@segreport.test", "columnist"],
    [IDS.otherColumnistId, "outro@segreport.test", "columnist"],
    [IDS.readerId, "leitor@segreport.test", "reader"],
  ];

  for (const [id, email, role] of people) {
    // `profiles` NÃO tem coluna de e-mail: ele mora em auth.users. A coluna
    // `full_name` existe e é o rótulo humano disponível.
    await client.query(
      `insert into auth.users (id, email, instance_id, aud, role)
       values ($1, $2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
       on conflict (id) do nothing`,
      [id, email]
    );
    await client.query(
      `insert into public.profiles (id, full_name, role)
       values ($1, $2, $3)
       on conflict (id) do update set role = excluded.role`,
      [id, email.split("@")[0], role]
    );
  }

  const authors: Array<[string, string, string, string | null]> = [
    [IDS.adminAuthorId, "Redação SegReport", "redacao", null],
    [IDS.columnistAuthorId, "Helena Braga", "helena-braga", IDS.columnistId],
    [IDS.otherAuthorId, "Rodrigo Teixeira", "rodrigo-teixeira", IDS.otherColumnistId],
  ];

  for (const [id, name, slug, profileId] of authors) {
    await client.query(
      `insert into public.authors (id, name, slug, profile_id)
       values ($1, $2, $3, $4)
       on conflict (id) do update set profile_id = excluded.profile_id`,
      [id, name, slug, profileId]
    );
  }

  return IDS;
}

export { IDS as SEED_IDS };
```

Criar `tests/rls/profiles.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { actAs, pool, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(async () => {
  await pool.end();
});

describe("perfis e papéis", () => {
  it("current_role devolve o papel de quem está pedindo", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await actAs(client, ids.columnistId);
      const result = await client.query("select public.current_role() as role");
      expect(result.rows[0].role).toBe("columnist");
    });
  });

  it("is_admin distingue admin de colunista", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await actAs(client, ids.adminId);
      const asAdmin = await client.query("select public.is_admin() as ok");
      expect(asAdmin.rows[0].ok).toBe(true);
    });

    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await actAs(client, ids.columnistId);
      const asColumnist = await client.query("select public.is_admin() as ok");
      expect(asColumnist.rows[0].ok).toBe(false);
    });
  });

  it("current_author_id encontra a assinatura pública do colunista", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await actAs(client, ids.columnistId);
      const result = await client.query("select public.current_author_id() as id");
      expect(result.rows[0].id).toBe(ids.columnistAuthorId);
    });
  });

  it("colunista NÃO consegue se promover a admin", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await actAs(client, ids.columnistId);

      await client
        .query("update public.profiles set role = 'admin' where id = $1", [
          ids.columnistId,
        ])
        .catch(() => undefined); // negar por policy ou por erro, ambos servem

      await client.query("reset role");
      const check = await client.query(
        "select role from public.profiles where id = $1",
        [ids.columnistId]
      );
      expect(check.rows[0].role).toBe("columnist");
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

```bash
npm test -- tests/rls/profiles.test.ts
```

Esperado: todos falham com `function public.current_role() does not exist` ou `column "role" does not exist`.

- [ ] **Step 3: Escrever a migração**

Criar `supabase/migrations/20260922000001_roles_and_helpers.sql`:

```sql
-- Papéis do CMS -------------------------------------------------------------
-- A coluna `role` JÁ EXISTE desde a migração de junho, com os valores
-- reader | editor | admin. O CMS troca 'editor' por 'columnist', que é o
-- papel que a máquina de estados conhece.
--
-- A ORDEM importa: converter os dados antes de trocar a restrição. Ao
-- contrário, a restrição nova recusaria as linhas existentes.

alter table public.profiles
  add column if not exists invited_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles set role = 'columnist' where role = 'editor';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'columnist', 'reader'));

-- Assinatura pública --------------------------------------------------------
-- `authors` tem name, bio, avatar_url, email e twitter_handle. Faltam o slug
-- da página pública, o cargo exibido na assinatura, e a ligação com a conta.

alter table public.authors
  add column if not exists slug text,
  add column if not exists role text;

-- Preenche o slug das linhas que já existem antes de exigir unicidade.
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
-- on delete set null preserva a autoria histórica quando a conta some.

alter table public.authors
  add column if not exists profile_id uuid unique
  references public.profiles(id) on delete set null;

-- Funções auxiliares --------------------------------------------------------
-- security definer com search_path fixo é obrigatório: sem ele, a policy de
-- profiles impediria a própria função de ler a linha de que precisa.

create or replace function public.current_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false)
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

-- Escalada de papel é impossível -------------------------------------------
-- O usuário pode editar o próprio perfil, mas nunca a coluna `role`. Sem esta
-- trava, todas as outras policies são contornáveis.

create or replace function public.guard_profile_role() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'apenas administradores alteram papel';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();
```

- [ ] **Step 4: Aplicar e rodar os testes**

```bash
npm run db:push:test
npm test -- tests/rls/profiles.test.ts
```

Esperado: os quatro testes passam.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260922000001_roles_and_helpers.sql tests/
git commit -m "feat(db): papéis do CMS, ligação authors-profiles e funções de RLS"
```

---

### Task 3: Colunas do CMS e máquina de estados da matéria

**Files:**
- Create: `supabase/migrations/20260922000002_articles_cms.sql`
- Create: `tests/rls/articles-schema.test.ts`

**Interfaces:**
- Consumes: `seedUsers`, `withRollback` das Tasks 1–2
- Produces: colunas `articles.content_json jsonb`, `content_text text`, `standfirst text`, `scheduled_for timestamptz`, `seo_title text`, `seo_description text`, `updated_by uuid`; `status` aceitando `draft | in_review | scheduled | published | archived`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/rls/articles-schema.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { pool, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(async () => {
  await pool.end();
});

describe("esquema de matérias", () => {
  it("aceita os cinco estados da máquina", async () => {
    const estados = ["draft", "in_review", "scheduled", "published", "archived"];

    for (const estado of estados) {
      await withRollback(async (client) => {
        const ids = await seedUsers(client);
        await client.query(
          `insert into public.articles (slug, title, status, author_id)
           values ($1, 'Título de teste', $2, $3)`,
          [`teste-${estado}`, estado, ids.columnistAuthorId]
        );
        const result = await client.query(
          "select status from public.articles where slug = $1",
          [`teste-${estado}`]
        );
        expect(result.rows[0].status).toBe(estado);
      });
    }
  });

  it("recusa um estado inventado", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await expect(
        client.query(
          `insert into public.articles (slug, title, status, author_id)
           values ('teste-invalido', 'T', 'publicado_talvez', $1)`,
          [ids.columnistAuthorId]
        )
      ).rejects.toThrow();
    });
  });

  it("guarda o documento de blocos e o texto derivado", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      const doc = {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Olá mercado." }] },
        ],
      };
      await client.query(
        `insert into public.articles (slug, title, status, author_id, content_json, content_text, standfirst)
         values ('teste-doc', 'T', 'draft', $1, $2, $3, $4)`,
        [ids.columnistAuthorId, doc, "Olá mercado.", "Linha de apoio"]
      );
      const result = await client.query(
        "select content_json, content_text, standfirst from public.articles where slug = 'teste-doc'"
      );
      expect(result.rows[0].content_json.content[0].type).toBe("paragraph");
      expect(result.rows[0].content_text).toBe("Olá mercado.");
      expect(result.rows[0].standfirst).toBe("Linha de apoio");
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

```bash
npm test -- tests/rls/articles-schema.test.ts
```

Esperado: falha em `new row for relation "articles" violates check constraint "articles_status_check"` para `in_review`, e `column "content_json" does not exist`.

- [ ] **Step 3: Escrever a migração**

Criar `supabase/migrations/20260922000002_articles_cms.sql`:

```sql
-- Colunas do CMS ------------------------------------------------------------

alter table public.articles
  add column if not exists content_json    jsonb,
  add column if not exists content_text    text,
  add column if not exists standfirst      text,
  add column if not exists scheduled_for   timestamptz,
  add column if not exists seo_title       text,
  add column if not exists seo_description text,
  add column if not exists updated_by      uuid references public.profiles(id) on delete set null;

comment on column public.articles.content_text is
  'Texto puro extraído de content_json no salvamento. Existe só para busca — procurar palavra dentro de jsonb não usa índice de texto.';

comment on column public.articles.content is
  'LEGADO. Mantido durante a migração para content_json. Remover em migração futura quando nenhuma linha depender dele.';

-- Máquina de estados --------------------------------------------------------

alter table public.articles drop constraint if exists articles_status_check;

alter table public.articles
  add constraint articles_status_check
  check (status in ('draft', 'in_review', 'scheduled', 'published', 'archived'));

-- Matéria agendada precisa de horário; publicada precisa de data de publicação.
alter table public.articles drop constraint if exists articles_scheduled_needs_time;
alter table public.articles
  add constraint articles_scheduled_needs_time
  check (status <> 'scheduled' or scheduled_for is not null);

-- Índices -------------------------------------------------------------------

create index if not exists articles_status_published_idx
  on public.articles (status, published_at desc) where status = 'published';

create index if not exists articles_author_idx on public.articles (author_id);

create index if not exists articles_scheduled_idx
  on public.articles (scheduled_for) where status = 'scheduled';

create index if not exists articles_search_idx
  on public.articles using gin (to_tsvector('portuguese', coalesce(content_text, '')));
```

- [ ] **Step 4: Aplicar e rodar os testes**

```bash
npm run db:push:test
npm test -- tests/rls/articles-schema.test.ts
```

Esperado: os três testes passam.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260922000002_articles_cms.sql tests/
git commit -m "feat(db): colunas do CMS, máquina de estados e índices de matéria"
```

---

### Task 4: Tags, relação de tags e biblioteca de mídia

**Files:**
- Create: `supabase/migrations/20260922000003_tags_and_media.sql`
- Create: `tests/rls/media-schema.test.ts`

**Interfaces:**
- Consumes: `seedUsers`, `withRollback`
- Produces: tabelas `public.tags(id, slug, label)`, `public.article_tags(article_id, tag_id)`, `public.media_assets(id, storage_path, alt, credit, width, height, bytes, uploaded_by, created_at)`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/rls/media-schema.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { pool, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(async () => {
  await pool.end();
});

describe("esquema de mídia e tags", () => {
  it("exige texto alternativo com pelo menos três caracteres", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await expect(
        client.query(
          `insert into public.media_assets (storage_path, alt, uploaded_by)
           values ('media/foto.webp', '  ', $1)`,
          [ids.adminId]
        )
      ).rejects.toThrow();
    });
  });

  it("aceita mídia com texto alternativo válido", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await client.query(
        `insert into public.media_assets (storage_path, alt, credit, width, height, bytes, uploaded_by)
         values ('media/foto.webp', 'Fachada da sede da SUSEP', 'Divulgação', 1600, 900, 240000, $1)`,
        [ids.adminId]
      );
      const result = await client.query(
        "select alt, width from public.media_assets where storage_path = 'media/foto.webp'"
      );
      expect(result.rows[0].alt).toBe("Fachada da sede da SUSEP");
      expect(result.rows[0].width).toBe(1600);
    });
  });

  it("não aceita o mesmo caminho de armazenamento duas vezes", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await client.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/unica.webp', 'Uma imagem qualquer', $1)`,
        [ids.adminId]
      );
      await expect(
        client.query(
          `insert into public.media_assets (storage_path, alt, uploaded_by)
           values ('media/unica.webp', 'Outra descrição', $1)`,
          [ids.adminId]
        )
      ).rejects.toThrow();
    });
  });

  it("liga matéria a tag sem permitir duplicata", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      const article = await client.query(
        `insert into public.articles (slug, title, status, author_id)
         values ('com-tag', 'T', 'draft', $1) returning id`,
        [ids.columnistAuthorId]
      );
      const tag = await client.query(
        `insert into public.tags (slug, label) values ('open-insurance', 'Open Insurance') returning id`
      );
      const articleId = article.rows[0].id;
      const tagId = tag.rows[0].id;

      await client.query(
        "insert into public.article_tags (article_id, tag_id) values ($1, $2)",
        [articleId, tagId]
      );
      await expect(
        client.query(
          "insert into public.article_tags (article_id, tag_id) values ($1, $2)",
          [articleId, tagId]
        )
      ).rejects.toThrow();
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

```bash
npm test -- tests/rls/media-schema.test.ts
```

Esperado: `relation "public.media_assets" does not exist`.

- [ ] **Step 3: Escrever a migração**

Criar `supabase/migrations/20260922000003_tags_and_media.sql`:

```sql
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

alter table public.tags          enable row level security;
alter table public.article_tags  enable row level security;
alter table public.media_assets  enable row level security;
```

- [ ] **Step 4: Aplicar e rodar os testes**

```bash
npm run db:push:test
npm test -- tests/rls/media-schema.test.ts
```

Esperado: os quatro testes passam.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260922000003_tags_and_media.sql tests/
git commit -m "feat(db): tags e biblioteca de mídia com texto alternativo obrigatório"
```

---

### Task 5: Policies de RLS do CMS

**Files:**
- Create: `supabase/migrations/20260922000004_cms_rls.sql`
- Create: `tests/rls/articles.test.ts`
- Create: `tests/rls/media.test.ts`

**Interfaces:**
- Consumes: funções da Task 2, tabelas das Tasks 3–4
- Produces: policies que garantem a tabela de autoridade da spec

Esta é a task mais importante do plano. Tudo o que vem depois confia nela.

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/rls/articles.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import type { PoolClient } from "pg";
import { actAs, pool, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(async () => {
  await pool.end();
});

/** Cria uma matéria como `postgres`, antes de qualquer troca de identidade. */
async function seedArticle(
  client: PoolClient,
  authorId: string,
  status: string,
  slug: string
): Promise<string> {
  const result = await client.query(
    `insert into public.articles (slug, title, status, author_id, scheduled_for)
     values ($1, 'Matéria de teste', $2, $3, case when $2 = 'scheduled' then now() + interval '1 day' else null end)
     returning id`,
    [slug, status, authorId]
  );
  return result.rows[0].id;
}

describe("RLS de matérias — leitura", () => {
  it("anônimo lê matéria publicada", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "published", "publicada");
      await actAs(client, null);
      const result = await client.query(
        "select id from public.articles where slug = 'publicada'"
      );
      expect(result.rowCount).toBe(1);
    });
  });

  it("anônimo NÃO lê rascunho", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "draft", "rascunho");
      await actAs(client, null);
      const result = await client.query(
        "select id from public.articles where slug = 'rascunho'"
      );
      expect(result.rowCount).toBe(0);
    });
  });

  it("leitor autenticado NÃO lê rascunho", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "draft", "rascunho");
      await actAs(client, ids.readerId);
      const result = await client.query(
        "select id from public.articles where slug = 'rascunho'"
      );
      expect(result.rowCount).toBe(0);
    });
  });

  it("colunista NÃO lê rascunho de outro autor", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.otherAuthorId, "draft", "alheia");
      await actAs(client, ids.columnistId);
      const result = await client.query(
        "select id from public.articles where slug = 'alheia'"
      );
      expect(result.rowCount).toBe(0);
    });
  });

  it("colunista lê o próprio rascunho", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "draft", "minha");
      await actAs(client, ids.columnistId);
      const result = await client.query(
        "select id from public.articles where slug = 'minha'"
      );
      expect(result.rowCount).toBe(1);
    });
  });

  it("admin lê rascunho de qualquer autor", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.otherAuthorId, "draft", "de-outro");
      await actAs(client, ids.adminId);
      const result = await client.query(
        "select id from public.articles where slug = 'de-outro'"
      );
      expect(result.rowCount).toBe(1);
    });
  });
});

describe("RLS de matérias — escrita", () => {
  it("colunista NÃO consegue publicar", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "draft", "tentativa");
      await actAs(client, ids.columnistId);

      await client
        .query("update public.articles set status = 'published' where slug = 'tentativa'")
        .catch(() => undefined);

      await client.query("reset role");
      const check = await client.query(
        "select status from public.articles where slug = 'tentativa'"
      );
      expect(check.rows[0].status).toBe("draft");
    });
  });

  it("colunista NÃO consegue agendar", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "draft", "agendar");
      await actAs(client, ids.columnistId);

      await client
        .query(
          `update public.articles
              set status = 'scheduled', scheduled_for = now() + interval '1 hour'
            where slug = 'agendar'`
        )
        .catch(() => undefined);

      await client.query("reset role");
      const check = await client.query(
        "select status from public.articles where slug = 'agendar'"
      );
      expect(check.rows[0].status).toBe("draft");
    });
  });

  it("colunista envia o próprio rascunho para revisão", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "draft", "enviar");
      await actAs(client, ids.columnistId);

      await client.query(
        "update public.articles set status = 'in_review' where slug = 'enviar'"
      );

      await client.query("reset role");
      const check = await client.query(
        "select status from public.articles where slug = 'enviar'"
      );
      expect(check.rows[0].status).toBe("in_review");
    });
  });

  it("colunista NÃO edita matéria de outro autor", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.otherAuthorId, "draft", "de-terceiro");
      await actAs(client, ids.columnistId);

      const result = await client
        .query("update public.articles set title = 'Invadida' where slug = 'de-terceiro'")
        .catch(() => ({ rowCount: 0 }));

      expect(result.rowCount).toBe(0);
    });
  });

  it("colunista NÃO edita matéria já publicada, nem a própria", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "published", "no-ar");
      await actAs(client, ids.columnistId);

      const result = await client
        .query("update public.articles set title = 'Alterada' where slug = 'no-ar'")
        .catch(() => ({ rowCount: 0 }));

      expect(result.rowCount).toBe(0);
    });
  });

  it("admin publica sem obstáculo", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await seedArticle(client, ids.columnistAuthorId, "in_review", "aprovar");
      await actAs(client, ids.adminId);

      await client.query(
        "update public.articles set status = 'published', published_at = now() where slug = 'aprovar'"
      );

      await client.query("reset role");
      const check = await client.query(
        "select status from public.articles where slug = 'aprovar'"
      );
      expect(check.rows[0].status).toBe("published");
    });
  });

  it("leitor NÃO escreve em matérias", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await actAs(client, ids.readerId);
      const result = await client
        .query(
          `insert into public.articles (slug, title, status, author_id)
           values ('do-leitor', 'T', 'draft', $1)`,
          [ids.columnistAuthorId]
        )
        .catch(() => ({ rowCount: 0 }));
      expect(result.rowCount).toBe(0);
    });
  });
});
```

Criar `tests/rls/media.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { actAs, pool, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(async () => {
  await pool.end();
});

describe("RLS da biblioteca de mídia", () => {
  it("colunista enxerga mídia enviada por outra pessoa", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await client.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/do-admin.webp', 'Foto enviada pelo admin', $1)`,
        [ids.adminId]
      );
      await actAs(client, ids.columnistId);
      const result = await client.query(
        "select id from public.media_assets where storage_path = 'media/do-admin.webp'"
      );
      expect(result.rowCount).toBe(1);
    });
  });

  it("colunista envia mídia", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await actAs(client, ids.columnistId);
      await client.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/do-colunista.webp', 'Gráfico de sinistralidade', $1)`,
        [ids.columnistId]
      );
      const result = await client.query(
        "select id from public.media_assets where storage_path = 'media/do-colunista.webp'"
      );
      expect(result.rowCount).toBe(1);
    });
  });

  it("colunista NÃO apaga mídia — remover arquivo em uso quebra matéria alheia", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await client.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/em-uso.webp', 'Imagem usada por outra matéria', $1)`,
        [ids.adminId]
      );
      await actAs(client, ids.columnistId);

      const result = await client
        .query("delete from public.media_assets where storage_path = 'media/em-uso.webp'")
        .catch(() => ({ rowCount: 0 }));

      expect(result.rowCount).toBe(0);
    });
  });

  it("anônimo NÃO enxerga perfis — plano e papel de assinante são privados", async () => {
    await withRollback(async (client) => {
      await seedUsers(client);
      await actAs(client, null);
      const result = await client.query("select id from public.profiles");
      expect(result.rowCount).toBe(0);
    });
  });

  it("colunista enxerga o próprio perfil, mas não o dos outros", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await actAs(client, ids.columnistId);
      const result = await client.query("select id from public.profiles");
      expect(result.rows.map((r) => r.id)).toEqual([ids.columnistId]);
    });
  });

  it("anônimo NÃO enxerga a biblioteca", async () => {
    await withRollback(async (client) => {
      const ids = await seedUsers(client);
      await client.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/privada.webp', 'Imagem qualquer', $1)`,
        [ids.adminId]
      );
      await actAs(client, null);
      const result = await client.query("select id from public.media_assets");
      expect(result.rowCount).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar as falhas**

```bash
npm test -- tests/rls/articles.test.ts tests/rls/media.test.ts
```

Esperado: os testes de leitura anônima de rascunho e de escrita do colunista **falham**, porque as policies atuais de `articles` vêm da migração de junho e não conhecem os papéis novos. Anote quais passam por acidente — elas passarão de novo depois.

- [ ] **Step 3: Escrever a migração de policies**

Criar `supabase/migrations/20260922000004_cms_rls.sql`:

```sql
-- Substitui as policies de junho ---------------------------------------------
-- Nomes conferidos em 20260616000002_rls_policies.sql. `articles_editor_all`
-- dava acesso total a quem tivesse papel 'editor' — que agora é 'columnist',
-- e colunista não pode publicar. Manter essa policy anularia todo o resto.

drop policy if exists "articles_select_free"    on public.articles;
drop policy if exists "articles_select_premium" on public.articles;
drop policy if exists "articles_editor_all"     on public.articles;

alter table public.articles enable row level security;

-- Perfil deixa de ser público ------------------------------------------------
-- `profiles_select_public` expunha papel e plano de todos os usuários a
-- visitantes anônimos. Num veículo com assinatura, isso revela quem paga.
-- O portal não precisa de `profiles`: a assinatura pública das matérias vem
-- de `authors`, que continua com leitura aberta.

drop policy if exists "profiles_select_public" on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- LEITURA -------------------------------------------------------------------

-- Toda matéria publicada é legível, INCLUSIVE a marcada como premium.
--
-- Isso parece afrouxar o paywall, mas é o desenho aprovado na spec. A linha
-- carrega título, linha de apoio, capa e metadados — que precisam ser
-- públicos e indexáveis, porque são o canal de aquisição por busca. O que é
-- restrito é o CORPO, e ele nunca sai por aqui: a página estática entrega o
-- documento até o corte, e a continuação vem de /api/materia/[slug]/restrito,
-- que confere o plano na sessão. A policy antiga `articles_select_premium`
-- escondia a matéria inteira do não assinante — e escondia do Google junto.
create policy articles_select_published on public.articles
  for select to anon, authenticated
  using (status = 'published');

create policy articles_select_own on public.articles
  for select to authenticated
  using (author_id = public.current_author_id());

create policy articles_select_admin on public.articles
  for select to authenticated
  using (public.is_admin());

-- ESCRITA — COLUNISTA -------------------------------------------------------
-- O `with check` é a metade que importa. Sem ele o colunista leria a própria
-- matéria em rascunho e a gravaria de volta com status = 'published'.

create policy articles_insert_columnist on public.articles
  for insert to authenticated
  with check (
    author_id = public.current_author_id()
    and status in ('draft', 'in_review')
  );

create policy articles_update_columnist on public.articles
  for update to authenticated
  using (
    author_id = public.current_author_id()
    and status in ('draft', 'in_review')
  )
  with check (
    author_id = public.current_author_id()
    and status in ('draft', 'in_review')
  );

-- ESCRITA — ADMIN -----------------------------------------------------------

create policy articles_insert_admin on public.articles
  for insert to authenticated with check (public.is_admin());

create policy articles_update_admin on public.articles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy articles_delete_admin on public.articles
  for delete to authenticated using (public.is_admin());

-- MÍDIA ---------------------------------------------------------------------
-- Biblioteca compartilhada: numa redação pequena, obrigar cada pessoa a
-- ressubir a mesma foto gera duplicata e desperdiça armazenamento.
-- Apagar é só do admin, porque remover arquivo em uso quebra matéria alheia.

create policy media_select_staff on public.media_assets
  for select to authenticated
  using (public.current_role() in ('admin', 'columnist'));

create policy media_insert_staff on public.media_assets
  for insert to authenticated
  with check (public.current_role() in ('admin', 'columnist'));

create policy media_update_admin on public.media_assets
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy media_delete_admin on public.media_assets
  for delete to authenticated using (public.is_admin());

-- TAGS ----------------------------------------------------------------------

create policy tags_select_all on public.tags
  for select to anon, authenticated using (true);

create policy tags_write_admin on public.tags
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy article_tags_select_all on public.article_tags
  for select to anon, authenticated using (true);

create policy article_tags_write_staff on public.article_tags
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.articles a
       where a.id = article_id
         and a.author_id = public.current_author_id()
         and a.status in ('draft', 'in_review')
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.articles a
       where a.id = article_id
         and a.author_id = public.current_author_id()
         and a.status in ('draft', 'in_review')
    )
  );
```

- [ ] **Step 4: Aplicar e rodar a bateria inteira**

```bash
npm run db:push:test
npm test
```

Esperado: todos os testes das Tasks 1 a 5 passam. Se `colunista NÃO edita matéria já publicada` falhar, verifique que `articles_update_columnist` tem o filtro de `status` **no `using` e no `with check`** — só num dos dois não basta.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260922000004_cms_rls.sql tests/
git commit -m "feat(db): policies de RLS do CMS com bateria de testes por papel"
```

---

### Task 6: Entrada por link mágico

**Files:**
- Create: `src/lib/auth/session.ts`
- Modify: `src/app/(portal)/login/page.tsx`
- Create: `src/app/(portal)/login/actions.ts`
- Create: `src/app/(portal)/login/LoginForm.tsx`
- Create: `src/app/auth/confirm/route.ts`
- Modify: `src/components/portal/AuthForm.tsx`

**Interfaces:**
- Consumes: `src/lib/supabase/server.ts` (já existe)
- Produces: `getSessionProfile(): Promise<SessionProfile | null>` com `SessionProfile = { id: string; email: string; role: 'admin' | 'columnist' | 'reader'; authorId: string | null }`; `requireRole(roles: Role[]): Promise<SessionProfile>`; Server Action `enviarLinkMagico(_estado: EstadoLogin, dados: FormData): Promise<EstadoLogin>`

- [ ] **Step 1: Ler o guia de autenticação do Next**

```bash
sed -n '1,120p' node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
```

Confirme a forma atual de Server Action e de `redirect`, que mudou entre versões.

- [ ] **Step 2: Escrever o módulo de sessão**

Criar `src/lib/auth/session.ts`:

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "columnist" | "reader";

export interface SessionProfile {
  id: string;
  email: string;
  role: Role;
  /** Assinatura pública. Nulo para quem não é colunista. */
  authorId: string | null;
}

/**
 * Perfil de quem está pedindo, ou null se não houver sessão.
 *
 * Lê o papel do banco a cada chamada em vez de confiar no token: papel
 * revogado precisa valer na requisição seguinte, não só no próximo login.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  // `profiles` não guarda e-mail — ele mora em auth.users e chega pela sessão.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", auth.user.id)
    .single();

  if (!profile) return null;

  const { data: author } = await supabase
    .from("authors")
    .select("id")
    .eq("profile_id", auth.user.id)
    .maybeSingle();

  return {
    id: profile.id,
    email: auth.user.email ?? "",
    role: profile.role as Role,
    authorId: author?.id ?? null,
  };
}

/** Exige um dos papéis; redireciona para o login quando não houver. */
export async function requireRole(roles: Role[]): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?motivo=sessao");
  if (!roles.includes(profile.role)) redirect("/login?motivo=permissao");
  return profile;
}
```

- [ ] **Step 3: Escrever a Server Action de envio**

Criar `src/app/(portal)/login/actions.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export interface EstadoLogin {
  status: "inicial" | "enviado" | "erro";
  mensagem?: string;
}

export async function enviarLinkMagico(
  _estado: EstadoLogin,
  dados: FormData
): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "").trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: "erro", mensagem: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origem}/auth/confirm`,
      // Só entra quem já foi convidado. Sem isso, qualquer pessoa cria conta
      // pedindo um link — e o painel passa a ter porta aberta.
      shouldCreateUser: false,
    },
  });

  if (error) {
    // Mensagem idêntica no sucesso e no erro: dizer "este e-mail não existe"
    // entrega ao atacante a lista de quem tem conta.
    return {
      status: "enviado",
      mensagem: "Se este e-mail tiver acesso, o link chegará em instantes.",
    };
  }

  return {
    status: "enviado",
    mensagem: "Se este e-mail tiver acesso, o link chegará em instantes.",
  };
}
```

- [ ] **Step 4: Escrever a rota de confirmação**

Criar `src/app/auth/confirm/route.ts`:

```ts
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Recebe o clique no link do e-mail e troca o código por uma sessão.
 * O destino depende do papel: quem edita vai para o painel, leitor vai para
 * o Hub.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type) redirect("/login?motivo=link-invalido");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) redirect("/login?motivo=link-expirado");

  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user!.id)
    .single();

  redirect(profile?.role === "reader" || !profile ? "/hub" : "/admin");
}
```

- [ ] **Step 5: Trocar o formulário por um que envia de verdade**

Criar `src/app/(portal)/login/LoginForm.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { enviarLinkMagico, type EstadoLogin } from "./actions";

const INICIAL: EstadoLogin = { status: "inicial" };

export default function LoginForm() {
  const [estado, acao, pendente] = useActionState(enviarLinkMagico, INICIAL);

  if (estado.status === "enviado") {
    return (
      <div className="rounded-lg border border-hairline bg-forest-100 px-5 py-6 text-center">
        <p className="text-sm font-semibold text-forest-800">Verifique seu e-mail</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">{estado.mensagem}</p>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-2"
        >
          E-mail profissional
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-4 focus:border-forest-500 focus:bg-white"
        />
      </div>

      {estado.status === "erro" && (
        <p role="alert" className="text-sm text-down">
          {estado.mensagem}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-lg bg-forest-800 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
      >
        {pendente ? "Enviando…" : "Receber link de acesso"}
      </button>
    </form>
  );
}
```

Substituir o corpo de `src/app/(portal)/login/page.tsx` para usar `LoginForm` no lugar de `AuthForm`, mantendo o enquadramento visual atual (cartão centralizado, `max-w-md`). Remover de `src/components/portal/AuthForm.tsx` o aviso de que a autenticação não está ligada, já que passa a estar.

- [ ] **Step 6: Verificar manualmente**

```bash
npm run dev
```

Abrir `http://localhost:3000/login`, enviar um e-mail que **não** foi convidado, e confirmar que a resposta é a mesma mensagem neutra — nada deve revelar se a conta existe.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth src/app/\(portal\)/login src/app/auth src/components/portal/AuthForm.tsx
git commit -m "feat(auth): entrada por link mágico com resposta neutra"
```

---

### Task 7: Convite de colunista

**Files:**
- Create: `src/lib/supabase/admin.ts`
- Create: `src/app/(admin)/admin/colunistas/actions.ts`
- Modify: `.env.local.example`

**Interfaces:**
- Consumes: `requireRole` da Task 6
- Produces: `criarClienteAdmin(): SupabaseClient` (somente servidor); Server Action `convidarColunista(_estado: EstadoConvite, dados: FormData): Promise<EstadoConvite>` com `EstadoConvite = { status: 'inicial' | 'ok' | 'erro'; mensagem?: string }`

- [ ] **Step 1: Isolar a chave que ignora a RLS**

Criar `src/lib/supabase/admin.ts`:

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave `service_role`.
 *
 * ATENÇÃO — esta chave IGNORA TODA A RLS. Ela existe por uma única razão:
 * convidar usuário exige criar conta alheia, e nenhuma policy permite isso.
 *
 * Regras, sem exceção:
 *   • Só este arquivo importa a chave.
 *   • Só a ação de convite usa este cliente.
 *   • Nunca em componente de página, nem em rota chamada pelo navegador
 *     sem verificação de papel antes.
 *
 * O `server-only` acima faz o build falhar se alguém importar isto de um
 * componente de cliente — a proteção é do compilador, não da disciplina.
 */
export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para convidar usuários."
    );
  }

  return createClient(url, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

```bash
npm install server-only
```

- [ ] **Step 2: Escrever a ação de convite**

Criar `src/app/(admin)/admin/colunistas/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";

export interface EstadoConvite {
  status: "inicial" | "ok" | "erro";
  mensagem?: string;
}

export async function convidarColunista(
  _estado: EstadoConvite,
  dados: FormData
): Promise<EstadoConvite> {
  // Guarda de papel ANTES de tocar no cliente que ignora a RLS.
  await requireRole(["admin"]);

  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  const nome = String(dados.get("nome") ?? "").trim();
  const cargo = String(dados.get("cargo") ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: "erro", mensagem: "Informe um e-mail válido." };
  }
  if (nome.length < 3) {
    return { status: "erro", mensagem: "Informe o nome completo do colunista." };
  }

  const admin = criarClienteAdmin();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: convidado, error: erroConvite } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origem}/auth/confirm`,
    });

  if (erroConvite || !convidado.user) {
    return {
      status: "erro",
      mensagem: `Não foi possível convidar: ${erroConvite?.message ?? "erro desconhecido"}`,
    };
  }

  const userId = convidado.user.id;

  // `profiles` não tem coluna de e-mail; `full_name` é o rótulo humano.
  const { error: erroPerfil } = await admin
    .from("profiles")
    .upsert({
      id: userId,
      full_name: nome,
      role: "columnist",
      invited_at: new Date().toISOString(),
    });

  if (erroPerfil) {
    return { status: "erro", mensagem: `Conta criada, mas o perfil falhou: ${erroPerfil.message}` };
  }

  const slug = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // `authors.email` já existia no esquema; `slug` e `role` foram acrescentados
  // pela migração da Task 2.
  const { error: erroAutor } = await admin
    .from("authors")
    .upsert(
      { profile_id: userId, name: nome, slug, email, role: cargo || "Colunista" },
      { onConflict: "profile_id" }
    );

  if (erroAutor) {
    return { status: "erro", mensagem: `Perfil criado, mas a assinatura falhou: ${erroAutor.message}` };
  }

  revalidatePath("/admin/colunistas");
  return { status: "ok", mensagem: `Convite enviado para ${email}.` };
}
```

- [ ] **Step 3: Documentar a variável de ambiente**

Em `.env.local.example`, garantir que existam com comentário:

```
# Apenas para o convite de usuários. IGNORA TODA A RLS — nunca exponha no browser.
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Usada para montar o link de retorno do e-mail.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 4: Provar que a chave está isolada**

```bash
grep -rn "SERVICE_ROLE" src --include=*.ts --include=*.tsx
```

Esperado: **uma única** ocorrência, em `src/lib/supabase/admin.ts`. Qualquer outra é falha e precisa ser corrigida antes do commit.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/admin.ts src/app/\(admin\) .env.local.example package.json package-lock.json
git commit -m "feat(admin): convite de colunista com service_role isolado"
```

---

### Task 8: Casca do painel com guarda de papel

**Files:**
- Create: `src/app/(admin)/admin/layout.tsx`
- Create: `src/app/(admin)/admin/page.tsx`
- Create: `src/components/admin/Sidebar.tsx`
- Create: `src/components/admin/PageHeader.tsx`
- Create: `src/app/(admin)/admin/colunistas/page.tsx`

**Interfaces:**
- Consumes: `requireRole`, `SessionProfile` da Task 6; `convidarColunista` da Task 7
- Produces: layout do painel; `<PageHeader titulo acao?>`

- [ ] **Step 1: Escrever a barra lateral**

Criar `src/components/admin/Sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import type { Role } from "@/lib/auth/session";

/**
 * Barra lateral escura do painel.
 *
 * Escolhida no brainstorming em vez de navegação horizontal: o painel nasce
 * com várias seções e vai receber Hub, anúncios e SUSEP. Vertical cresce,
 * horizontal não. E o contraste com a área clara evita a ambiguidade de
 * parecer o site público.
 */
const ITENS: Array<{ href: string; rotulo: string; papeis: Role[] }> = [
  { href: "/admin/materias", rotulo: "Matérias", papeis: ["admin", "columnist"] },
  { href: "/admin/colunistas", rotulo: "Colunistas", papeis: ["admin"] },
  { href: "/admin/midia", rotulo: "Mídia", papeis: ["admin", "columnist"] },
  { href: "/admin/ajustes", rotulo: "Ajustes", papeis: ["admin"] },
];

export default function Sidebar({
  papel,
  email,
}: {
  papel: Role;
  email: string;
}) {
  const pathname = usePathname();
  const visiveis = ITENS.filter((item) => item.papeis.includes(papel));

  return (
    <aside className="flex w-full shrink-0 flex-col bg-forest-900 px-3 py-4 lg:h-screen lg:w-60 lg:sticky lg:top-0">
      <Link href="/admin" className="mb-6 block px-2">
        <Logo variant="dark" className="h-6" />
      </Link>

      <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {visiveis.map((item) => {
          const ativo = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                ativo
                  ? "bg-forest-700 text-lime-400"
                  : "text-forest-300 hover:bg-forest-800 hover:text-white"
              }`}
            >
              {item.rotulo}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-white/10 pt-4 lg:block">
        <p className="truncate px-3 text-[11px] text-forest-500" title={email}>
          {email}
        </p>
        <Link
          href="/"
          className="mt-2 block px-3 text-xs font-medium text-forest-300 transition-colors hover:text-lime-400"
        >
          ← Ver o portal
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Escrever o cabeçalho de página e o layout**

Criar `src/components/admin/PageHeader.tsx`:

```tsx
export default function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-3">
            {descricao}
          </p>
        )}
      </div>
      {acao}
    </div>
  );
}
```

Criar `src/app/(admin)/admin/layout.tsx`:

```tsx
import type { Metadata } from "next";
import Sidebar from "@/components/admin/Sidebar";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel SegReport" },
  // O painel nunca deve ser indexado.
  robots: { index: false, follow: false },
};

// Todo o painel depende de quem pede; nada aqui pode ser pré-renderizado.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await requireRole(["admin", "columnist"]);

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <Sidebar papel={perfil.role} email={perfil.email} />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Escrever a raiz e a tela de colunistas**

Criar `src/app/(admin)/admin/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function AdminRaiz() {
  redirect("/admin/materias");
}
```

Criar `src/app/(admin)/admin/colunistas/page.tsx`:

```tsx
import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import FormularioConvite from "./FormularioConvite";

export const metadata: Metadata = { title: "Colunistas" };

export default async function ColunistasPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: colunistas } = await supabase
    .from("authors")
    .select("id, name, slug, role, profile_id")
    .not("profile_id", "is", null)
    .order("name");

  return (
    <>
      <PageHeader
        titulo="Colunistas"
        descricao="Convide por e-mail. O colunista escreve e envia para revisão; publicar é só seu."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-xl border border-hairline bg-white">
          {colunistas && colunistas.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {colunistas.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  <p className="mt-0.5 text-xs text-ink-3">{c.role}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-12 text-center text-sm text-ink-3">
              Nenhum colunista convidado ainda.
            </p>
          )}
        </div>

        <FormularioConvite />
      </div>
    </>
  );
}
```

Criar `src/app/(admin)/admin/colunistas/FormularioConvite.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { convidarColunista, type EstadoConvite } from "./actions";

const INICIAL: EstadoConvite = { status: "inicial" };

export default function FormularioConvite() {
  const [estado, acao, pendente] = useActionState(convidarColunista, INICIAL);

  return (
    <form action={acao} className="h-fit rounded-xl border border-hairline bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink">
        Convidar colunista
      </h2>

      <div className="mt-4 space-y-3">
        {[
          { id: "nome", rotulo: "Nome completo", tipo: "text" },
          { id: "email", rotulo: "E-mail", tipo: "email" },
          { id: "cargo", rotulo: "Cargo na assinatura", tipo: "text" },
        ].map((campo) => (
          <div key={campo.id}>
            <label
              htmlFor={campo.id}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-2"
            >
              {campo.rotulo}
            </label>
            <input
              id={campo.id}
              name={campo.id}
              type={campo.tipo}
              required={campo.id !== "cargo"}
              className="w-full rounded-lg border border-hairline bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-forest-500 focus:bg-white"
            />
          </div>
        ))}
      </div>

      {estado.mensagem && (
        <p
          role="status"
          className={`mt-3 text-xs leading-relaxed ${
            estado.status === "erro" ? "text-down" : "text-forest-700"
          }`}
        >
          {estado.mensagem}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="mt-4 w-full rounded-lg bg-forest-800 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
      >
        {pendente ? "Enviando…" : "Enviar convite"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Criar um marcador temporário para Matérias**

`/admin/materias` é o destino do redirecionamento e da barra lateral, e a tela real vem no plano seguinte. Criar `src/app/(admin)/admin/materias/page.tsx`:

```tsx
import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Matérias" };

export default async function MateriasPage() {
  const perfil = await requireRole(["admin", "columnist"]);

  return (
    <>
      <PageHeader
        titulo="Matérias"
        descricao={
          perfil.role === "columnist"
            ? "Suas colunas. Escreva, envie para revisão e acompanhe o status."
            : "Todas as matérias do portal, de qualquer autor."
        }
      />
      <p className="rounded-xl border border-dashed border-hairline bg-white/60 px-6 py-14 text-center text-sm text-ink-3">
        A listagem entra no próximo plano, junto com o editor.
      </p>
    </>
  );
}
```

- [ ] **Step 5: Verificar tipos, lint e build**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Esperado: os três limpos. Confirme na saída do build que as rotas `/admin/*` aparecem como `ƒ (Dynamic)` — se alguma sair como `○ (Static)`, o `force-dynamic` do layout não está sendo respeitado e o painel de um usuário poderia ser servido a outro.

- [ ] **Step 6: Verificar o acesso manualmente**

```bash
npm run dev
```

Abrir `http://localhost:3000/admin` **sem sessão**: deve redirecionar para `/login?motivo=sessao`. Com sessão de colunista, a barra lateral deve mostrar apenas Matérias e Mídia.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(admin\) src/components/admin
git commit -m "feat(admin): casca do painel com barra lateral e guarda de papel"
```

---

## Pronto quando

Você convida um colunista pelo painel, ele recebe o e-mail, clica no link e entra sem senha. Ele vê Matérias e Mídia; não vê Colunistas nem Ajustes. Você entra como admin e vê tudo. E a bateria de testes prova que, mesmo chamando o banco diretamente, o colunista não publica, não agenda, não edita matéria alheia e não se promove a administrador.

## O que vem depois

O plano seguinte (`2026-XX-XX-cms-editor.md`) cobre os passos 4 a 10 da spec: os três blocos próprios do Tiptap, o editor com trilho de metadados, a biblioteca de mídia, a listagem com fila de revisão, o `pg_cron` de publicação agendada e a troca de `src/lib/data/` de fixtures para consultas ao Supabase.

Os blocos do Tiptap vêm antes das telas de listagem de propósito: os nós customizados são a parte mais incerta do sub-projeto, e é melhor descobrir um problema de API na primeira semana do que na sexta, com telas já construídas sobre uma premissa errada.
