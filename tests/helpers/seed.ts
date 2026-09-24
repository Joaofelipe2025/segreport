import type { DbClient } from "./db";

/**
 * Contas e assinaturas públicas para os testes.
 *
 * Identificadores fixos: cada teste roda em transação com rollback, então
 * nunca há colisão entre eles, e a leitura do teste fica óbvia.
 */

export interface SeedIds {
  adminId: string;
  columnistId: string;
  otherColumnistId: string;
  readerId: string;
  adminAuthorId: string;
  columnistAuthorId: string;
  otherAuthorId: string;
}

export const SEED_IDS: SeedIds = {
  adminId: "11111111-1111-4111-8111-111111111111",
  columnistId: "22222222-2222-4222-8222-222222222222",
  otherColumnistId: "33333333-3333-4333-8333-333333333333",
  readerId: "44444444-4444-4444-8444-444444444444",
  adminAuthorId: "aaaaaaaa-1111-4111-8111-111111111111",
  columnistAuthorId: "aaaaaaaa-2222-4222-8222-222222222222",
  otherAuthorId: "aaaaaaaa-3333-4333-8333-333333333333",
};

/**
 * Semeia contas e autores.
 *
 * Precisa rodar como superusuário, ANTES de qualquer chamada a `actAs` —
 * depois da troca de papel a RLS bloqueia estas escritas.
 *
 * `profiles` não tem coluna de e-mail: ele mora em `auth.users`. O rótulo
 * humano disponível é `full_name`.
 */
export async function seedUsers(db: DbClient): Promise<SeedIds> {
  const pessoas: Array<[string, string, string]> = [
    [SEED_IDS.adminId, "admin@segreport.test", "admin"],
    [SEED_IDS.columnistId, "colunista@segreport.test", "columnist"],
    [SEED_IDS.otherColumnistId, "outro@segreport.test", "columnist"],
    [SEED_IDS.readerId, "leitor@segreport.test", "reader"],
  ];

  for (const [id, email, role] of pessoas) {
    await db.query(
      `insert into auth.users (id, email, instance_id, aud, role)
       values ($1, $2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
       on conflict (id) do nothing`,
      [id, email]
    );
    await db.query(
      `insert into public.profiles (id, full_name, role)
       values ($1, $2, $3)
       on conflict (id) do update set role = excluded.role`,
      [id, email.split("@")[0], role]
    );
  }

  const autores: Array<[string, string, string, string | null]> = [
    // "Redação SegReport" assina matéria e não tem conta — por isso profile_id
    // é anulável.
    [SEED_IDS.adminAuthorId, "Redação SegReport", "redacao", null],
    [SEED_IDS.columnistAuthorId, "Helena Braga", "helena-braga", SEED_IDS.columnistId],
    [SEED_IDS.otherAuthorId, "Rodrigo Teixeira", "rodrigo-teixeira", SEED_IDS.otherColumnistId],
  ];

  for (const [id, name, slug, profileId] of autores) {
    await db.query(
      `insert into public.authors (id, name, slug, profile_id)
       values ($1, $2, $3, $4)
       on conflict (id) do update set profile_id = excluded.profile_id`,
      [id, name, slug, profileId]
    );
  }

  return SEED_IDS;
}

/** Cria uma matéria como superusuário, antes de trocar de identidade. */
export async function seedArticle(
  db: DbClient,
  authorId: string,
  status: string,
  slug: string
): Promise<string> {
  const r = await db.query(
    `insert into public.articles (slug, title, status, author_id, scheduled_for)
     values ($1, 'Matéria de teste', $2, $3,
             case when $2 = 'scheduled' then now() + interval '1 day' else null end)
     returning id`,
    [slug, status, authorId]
  );
  return r.rows[0].id;
}
