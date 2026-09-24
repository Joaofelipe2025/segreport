import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Banco para os testes de RLS.
 *
 * Os testes não usam o cliente JavaScript do Supabase: falam direto com o
 * Postgres, semeiam os dados como superusuário, e só então assumem a
 * identidade `authenticated` definindo `request.jwt.claims`. Como `auth.uid()`
 * lê exatamente desse ajuste, isso exercita as policies reais sem precisar de
 * um servidor de autenticação de pé.
 *
 * DOIS BACKENDS, a mesma suíte:
 *
 *   • Padrão — PGlite, o Postgres compilado para WASM. Roda em memória, sem
 *     Docker, sem rede e sem projeto na nuvem. É o que permite escrever teste
 *     antes de implementação desde o primeiro dia.
 *   • Com `TEST_DATABASE_URL` definida — conexão real, para confirmar contra
 *     o Postgres do Supabase que o comportamento é o mesmo.
 *
 * O segundo existe porque o primeiro é uma aproximação: o esquema `auth` aqui
 * é criado por nós, e a versão do Postgres difere. Rodar nos dois é o que
 * impede uma diferença de comportamento passar despercebida.
 */

/** Linha genérica: o formato depende da consulta, então é aberto de propósito. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- linha de banco tem formato dinâmico
export type DbRow = Record<string, any>;

export interface DbClient {
  query(sql: string, params?: unknown[]): Promise<{ rows: DbRow[]; rowCount: number }>;
  exec(sql: string): Promise<void>;
}

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

/**
 * Peças que o Supabase provê e o PGlite não tem.
 *
 * `auth.uid()` reproduz a definição do Supabase literalmente. `auth.users`
 * existe porque `profiles.id` tem chave estrangeira para ela.
 */
const SUPABASE_SHIM = `
create schema if not exists auth;

do $$ begin
  create role anon nologin;
exception when duplicate_object then null; end $$;

do $$ begin
  create role authenticated nologin;
exception when duplicate_object then null; end $$;

do $$ begin
  create role service_role nologin bypassrls;
exception when duplicate_object then null; end $$;

-- As colunas espelham o que o projeto realmente usa. A de metadados do
-- usuário não é decoração: a migração de junho instala um gatilho em
-- auth.users que cria o perfil lendo full_name e avatar_url dela. Sem a
-- coluna, qualquer inserção de usuário quebra.
create table if not exists auth.users (
  id                 uuid primary key,
  email              text unique,
  instance_id        uuid,
  aud                text,
  role               text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data  jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
  language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub', '')::uuid
$$;

create or replace function auth.role() returns text
  language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '')::text
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
`;

/** Migrações em ordem de nome, que é a ordem cronológica do Supabase. */
export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

let backend: { client: DbClient; close: () => Promise<void> } | null = null;

async function boot() {
  if (backend) return backend;

  const url = process.env.TEST_DATABASE_URL;

  if (url) {
    // Proteção: nunca rodar a suíte no banco que serve a aplicação.
    const app = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const ref = app.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
    if (ref && url.includes(ref)) {
      throw new Error(
        `TEST_DATABASE_URL aponta para ${ref}, que é o projeto da aplicação. Use um banco separado.`
      );
    }

    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 4 });
    const client: DbClient = {
      async query(sql, params) {
        const r = await pool.query(sql, params as unknown[]);
        return { rows: r.rows as DbRow[], rowCount: r.rowCount ?? 0 };
      },
      async exec(sql) {
        await pool.query(sql);
      },
    };
    backend = { client, close: () => pool.end() };
    return backend;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite();
  await pg.exec(SUPABASE_SHIM);
  for (const file of migrationFiles()) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    try {
      await pg.exec(sql);
    } catch (cause) {
      throw new Error(`Migração ${file} falhou: ${(cause as Error).message}`);
    }
  }
  // Concessões de novo: tabelas criadas pelas migrações não herdam as de cima.
  await pg.exec(`
    grant all on all tables in schema public to anon, authenticated, service_role;
    grant all on all sequences in schema public to anon, authenticated, service_role;
  `);

  const client: DbClient = {
    async query(sql, params) {
      const r = await pg.query(sql, params as unknown[]);
      return { rows: r.rows as DbRow[], rowCount: r.rows.length };
    },
    async exec(sql) {
      await pg.exec(sql);
    },
  };
  backend = { client, close: () => pg.close() };
  return backend;
}

/** Qual backend está em uso — útil para mensagem de erro e para o relatório. */
export function backendName(): string {
  return process.env.TEST_DATABASE_URL ? "postgres remoto" : "pglite";
}

export async function closeDb(): Promise<void> {
  if (backend) {
    await backend.close();
    backend = null;
  }
}

/**
 * Roda o callback dentro de uma transação que sempre termina em rollback.
 *
 * Nenhum teste precisa limpar o que criou, e dois testes nunca enxergam os
 * dados um do outro — o que permite usar identificadores fixos sem colisão.
 */
export async function withRollback<T>(fn: (db: DbClient) => Promise<T>): Promise<T> {
  const { client } = await boot();
  await client.exec("begin");
  try {
    return await fn(client);
  } finally {
    await client.exec("rollback");
  }
}

/**
 * Assume a identidade de um usuário pelo resto da transação.
 *
 * `null` significa visitante anônimo. Depois desta chamada o papel deixa de
 * ser o superusuário, que ignora RLS — então semeie os dados ANTES de chamar.
 */
export async function actAs(db: DbClient, userId: string | null): Promise<void> {
  if (userId === null) {
    await db.exec("set local role anon");
    return;
  }
  await db.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
  await db.exec("set local role authenticated");
}

/** Volta ao superusuário para conferir o efeito real de uma escrita negada. */
export async function actAsOwner(db: DbClient): Promise<void> {
  await db.exec("reset role");
}

export interface WriteAttempt {
  /** A instrução foi aceita pelo banco? */
  ok: boolean;
  /** Linhas efetivamente afetadas. Zero significa negado pela policy. */
  rowCount: number;
  error?: string;
}

/**
 * Tenta uma escrita que pode ser negada, sem derrubar a transação do teste.
 *
 * Uma policy nega de duas formas distintas: silenciosamente, afetando zero
 * linhas, ou com exceção — quando um `with check` ou um gatilho reprova. No
 * segundo caso o Postgres ABORTA a transação inteira, e todo comando seguinte
 * falha com "current transaction is aborted". Um try/catch em JavaScript não
 * resolve isso: o estado é do banco, não do processo.
 *
 * O savepoint é o que permite ao teste continuar e conferir, como
 * superusuário, que a linha realmente não mudou — que é a asserção que
 * importa. Sem ele, o teste só saberia que houve erro, não que o dado está a
 * salvo.
 */
export async function tryWrite(
  db: DbClient,
  sql: string,
  params?: unknown[]
): Promise<WriteAttempt> {
  await db.exec("savepoint tentativa");
  try {
    const r = await db.query(sql, params);
    await db.exec("release savepoint tentativa");
    return { ok: true, rowCount: r.rowCount };
  } catch (cause) {
    await db.exec("rollback to savepoint tentativa");
    return { ok: false, rowCount: 0, error: (cause as Error).message };
  }
}
