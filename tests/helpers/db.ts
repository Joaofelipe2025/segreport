import { Pool, type PoolClient } from "pg";

/**
 * Conexão com o banco de testes.
 *
 * Os testes de RLS não usam o cliente JavaScript do Supabase: conectam direto
 * ao Postgres como o papel `postgres`, semeiam os dados, e só então assumem a
 * identidade `authenticated` com um `sub` escolhido. Como `auth.uid()` lê de
 * `request.jwt.claims`, isso exercita as policies reais sem precisar de um
 * servidor de autenticação de pé.
 */

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL ausente. Copie .env.test.example para .env.test e preencha.\n" +
      "NUNCA aponte para o banco de produção — a suíte escreve e apaga."
  );
}

// Proteção contra apontar os testes para o banco da aplicação por engano.
const producao = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const refProducao = producao.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];

if (refProducao && connectionString.includes(refProducao)) {
  throw new Error(
    `TEST_DATABASE_URL aponta para o projeto ${refProducao}, que é o da aplicação.\n` +
      "Use um banco separado: Docker local, ou um segundo projeto Supabase."
  );
}

export const pool = new Pool({ connectionString, max: 4 });

/**
 * Roda o callback dentro de uma transação que sempre termina em rollback.
 *
 * Nenhum teste precisa limpar o que criou, e dois testes nunca enxergam os
 * dados um do outro — o que permite usar identificadores fixos sem colisão.
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
 * Assume a identidade de um usuário pelo resto da transação.
 *
 * `null` significa visitante anônimo. Depois desta chamada o papel do Postgres
 * deixa de ser `postgres`, que ignora RLS — então semeie os dados ANTES de
 * chamar esta função.
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
