import { afterAll, describe, expect, it } from "vitest";
import { actAs, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(closeDb);

/**
 * A porta de ingestão, vista do banco.
 *
 * A rota grava com a chave de serviço, que ignora RLS. Isso é necessário — as
 * políticas de `storage.objects` e a criação de conta já exigiram o mesmo —,
 * mas significa que o ÚNICO obstáculo entre o agente externo e uma matéria
 * publicada passaria a ser o nosso próprio código.
 *
 * A trava opcional devolve ao banco o papel de impedir, não só de confiar.
 */
describe("registro de ingestão", () => {
  it("só o admin lê o histórico do que veio de fora", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        "insert into public.ingestao_recebidas (hash_conteudo, titulo) values ('abc', 'Uma matéria')"
      );

      await actAs(db, ids.adminId);
      const admin = await db.query("select titulo from public.ingestao_recebidas");
      expect(admin.rows).toHaveLength(1);

      await actAs(db, ids.columnistId);
      const colunista = await db.query("select titulo from public.ingestao_recebidas");
      expect(colunista.rows).toHaveLength(0);

      await actAs(db, null);
      const anonimo = await db.query("select titulo from public.ingestao_recebidas");
      expect(anonimo.rows).toHaveLength(0);
    });
  });

  it("o mesmo conteúdo não entra duas vezes", async () => {
    await withRollback(async (db) => {
      await db.query(
        "insert into public.ingestao_recebidas (hash_conteudo, titulo) values ('mesmo', 'A')"
      );
      const t = await tryWrite(
        db,
        "insert into public.ingestao_recebidas (hash_conteudo, titulo) values ('mesmo', 'B')"
      );
      expect(t.ok).toBe(false);
    });
  });
});

describe("trava contra publicar por fora do painel", () => {
  it("a semente e a migração continuam podendo criar matéria publicada", async () => {
    // A trava olha `current_user = 'service_role'`, não `auth.uid() is null`.
    // Guardar pelo segundo quebraria migração, semente e esta suíte inteira.
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id, published_at)
         values ('publicada-pela-semente', 'T', 'published', '${ids.columnistAuthorId}', now())`
      );
      expect(t.ok).toBe(true);
    });
  });

  it("a chave de serviço NÃO consegue inserir matéria já publicada", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query("set local role service_role");
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id)
         values ('tentativa', 'T', 'published', '${ids.columnistAuthorId}')`
      );
      expect(t.ok).toBe(false);
      await db.query("reset role");
    });
  });

  it("a chave de serviço INSERE em revisão, que é o caminho da ingestão", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query("set local role service_role");
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id)
         values ('vinda-do-agente', 'T', 'in_review', '${ids.columnistAuthorId}')`
      );
      expect(t.ok).toBe(true);
      await db.query("reset role");
    });
  });

  it("a chave de serviço não consegue criar matéria paga nem datada", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query("set local role service_role");

      const paga = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id, is_premium)
         values ('paga', 'T', 'in_review', '${ids.columnistAuthorId}', true)`
      );
      expect(paga.ok).toBe(false);

      const datada = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id, published_at)
         values ('datada', 'T', 'in_review', '${ids.columnistAuthorId}', now())`
      );
      expect(datada.ok).toBe(false);

      await db.query("reset role");
    });
  });
});
