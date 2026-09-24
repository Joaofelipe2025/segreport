import { afterAll, describe, expect, it } from "vitest";
import { actAs, actAsOwner, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedArticle, seedUsers } from "../helpers/seed";

afterAll(closeDb);

describe("RLS de matérias — leitura", () => {
  it("anônimo lê matéria publicada", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "publicada");
      await actAs(db, null);
      const r = await db.query("select id from public.articles where slug = 'publicada'");
      expect(r.rowCount).toBe(1);
    });
  });

  it("anônimo lê matéria publicada mesmo marcada como premium", async () => {
    // A linha carrega título, capa e metadados, que precisam ser indexáveis —
    // é o canal de aquisição por busca. O corpo restrito não sai por aqui.
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "premium");
      await db.query("update public.articles set is_premium = true where slug = 'premium'");
      await actAs(db, null);
      const r = await db.query("select id from public.articles where slug = 'premium'");
      expect(r.rowCount).toBe(1);
    });
  });

  it("anônimo NÃO lê rascunho", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho");
      await actAs(db, null);
      const r = await db.query("select id from public.articles where slug = 'rascunho'");
      expect(r.rowCount).toBe(0);
    });
  });

  it("leitor autenticado NÃO lê rascunho", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho");
      await actAs(db, ids.readerId);
      const r = await db.query("select id from public.articles where slug = 'rascunho'");
      expect(r.rowCount).toBe(0);
    });
  });

  it("colunista NÃO lê rascunho de outro autor", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.otherAuthorId, "draft", "alheia");
      await actAs(db, ids.columnistId);
      const r = await db.query("select id from public.articles where slug = 'alheia'");
      expect(r.rowCount).toBe(0);
    });
  });

  it("colunista lê o próprio rascunho", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "minha");
      await actAs(db, ids.columnistId);
      const r = await db.query("select id from public.articles where slug = 'minha'");
      expect(r.rowCount).toBe(1);
    });
  });

  it("admin lê rascunho de qualquer autor", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.otherAuthorId, "draft", "de-outro");
      await actAs(db, ids.adminId);
      const r = await db.query("select id from public.articles where slug = 'de-outro'");
      expect(r.rowCount).toBe(1);
    });
  });
});

describe("RLS de matérias — escrita", () => {
  it("colunista NÃO consegue publicar", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "tentativa");
      await actAs(db, ids.columnistId);

      const t = await tryWrite(
        db,
        "update public.articles set status = 'published' where slug = 'tentativa'"
      );
      expect(t.rowCount).toBe(0);

      await actAsOwner(db);
      const r = await db.query("select status from public.articles where slug = 'tentativa'");
      expect(r.rows[0].status).toBe("draft");
    });
  });

  it("colunista NÃO consegue agendar", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "agendar");
      await actAs(db, ids.columnistId);

      const t = await tryWrite(
        db,
        `update public.articles
            set status = 'scheduled', scheduled_for = now() + interval '1 hour'
          where slug = 'agendar'`
      );
      expect(t.rowCount).toBe(0);

      await actAsOwner(db);
      const r = await db.query("select status from public.articles where slug = 'agendar'");
      expect(r.rows[0].status).toBe("draft");
    });
  });

  it("colunista envia o próprio rascunho para revisão", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "enviar");
      await actAs(db, ids.columnistId);

      await db.query("update public.articles set status = 'in_review' where slug = 'enviar'");

      await actAsOwner(db);
      const r = await db.query("select status from public.articles where slug = 'enviar'");
      expect(r.rows[0].status).toBe("in_review");
    });
  });

  it("colunista cria rascunho assinado por ele", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);
      await db.query(
        `insert into public.articles (slug, title, status, author_id)
         values ('nova-minha', 'Nova', 'draft', $1)`,
        [ids.columnistAuthorId]
      );
      const r = await db.query("select id from public.articles where slug = 'nova-minha'");
      expect(r.rowCount).toBe(1);
    });
  });

  it("colunista NÃO cria matéria assinada por outro autor", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id)
         values ('roubada', 'T', 'draft', $1)`,
        [ids.otherAuthorId]
      );
      expect(t.ok).toBe(false);
    });
  });

  it("colunista NÃO edita matéria de outro autor", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.otherAuthorId, "draft", "de-terceiro");
      await actAs(db, ids.columnistId);

      const t = await tryWrite(
        db,
        "update public.articles set title = 'Invadida' where slug = 'de-terceiro'"
      );
      expect(t.rowCount).toBe(0);
    });
  });

  it("colunista NÃO edita matéria já publicada, nem a própria", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "no-ar");
      await actAs(db, ids.columnistId);

      const t = await tryWrite(
        db,
        "update public.articles set title = 'Alterada' where slug = 'no-ar'"
      );
      expect(t.rowCount).toBe(0);
    });
  });

  it("admin publica sem obstáculo", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "in_review", "aprovar");
      await actAs(db, ids.adminId);

      await db.query(
        "update public.articles set status = 'published', published_at = now() where slug = 'aprovar'"
      );

      await actAsOwner(db);
      const r = await db.query("select status from public.articles where slug = 'aprovar'");
      expect(r.rows[0].status).toBe("published");
    });
  });

  it("leitor NÃO escreve em matérias", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.readerId);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id)
         values ('do-leitor', 'T', 'draft', $1)`,
        [ids.columnistAuthorId]
      );
      expect(t.ok).toBe(false);
    });
  });
});

describe("RLS de perfis", () => {
  it("anônimo NÃO enxerga perfis — plano e papel de assinante são privados", async () => {
    await withRollback(async (db) => {
      await seedUsers(db);
      await actAs(db, null);
      const r = await db.query("select id from public.profiles");
      expect(r.rowCount).toBe(0);
    });
  });

  it("colunista enxerga o próprio perfil, e só ele", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);
      const r = await db.query("select id from public.profiles");
      expect(r.rows.map((x) => x.id)).toEqual([ids.columnistId]);
    });
  });

  it("admin promove outro usuário", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.adminId);
      await db.query("update public.profiles set role = 'admin' where id = $1", [
        ids.columnistId,
      ]);
      await actAsOwner(db);
      const r = await db.query("select role from public.profiles where id = $1", [
        ids.columnistId,
      ]);
      expect(r.rows[0].role).toBe("admin");
    });
  });
});
