import { afterAll, describe, expect, it } from "vitest";
import { actAs, actAsOwner, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedArticle, seedUsers } from "../helpers/seed";

afterAll(closeDb);

/**
 * Achados da revisão final. Cada teste aqui reproduz um vazamento que a
 * bateria anterior não pegava porque olhava a LINHA, e não a COLUNA.
 *
 * RLS é row-level: liberar a linha libera todas as colunas dela. O corpo da
 * matéria e o plano do assinante precisam de outra ferramenta.
 */

const CORPO = "CORPO SECRETO PAGO";

describe("corpo de matéria restrita", () => {
  it("anônimo NÃO lê o corpo de matéria premium", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "premium");
      await db.query(
        `update public.articles
            set is_premium = true, content = $1, content_text = $1,
                content_json = '{"txt":"restrito"}'::jsonb
          where slug = 'premium'`,
        [CORPO]
      );

      await actAs(db, null);
      const t = await tryWrite(
        db,
        "select content, content_json, content_text from public.articles where slug = 'premium'"
      );
      expect(t.ok).toBe(false);
    });
  });

  it("anônimo continua lendo título e capa — é o que o Google indexa", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "premium");
      await db.query("update public.articles set is_premium = true where slug = 'premium'");
      await actAs(db, null);
      const r = await db.query(
        "select title, slug, cover_url, published_at from public.articles where slug = 'premium'"
      );
      expect(r.rowCount).toBe(1);
    });
  });

  it("leitor do plano gratuito NÃO lê o corpo de matéria premium", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "premium");
      await db.query(
        "update public.articles set is_premium = true, content = $1 where slug = 'premium'",
        [CORPO]
      );
      await actAs(db, ids.readerId);
      const t = await tryWrite(db, "select content from public.articles where slug = 'premium'");
      expect(t.ok).toBe(false);
    });
  });

  it("a função de corpo entrega matéria aberta a qualquer um", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "aberta");
      await db.query("update public.articles set content = $1 where slug = 'aberta'", [
        "corpo livre",
      ]);
      await actAs(db, null);
      const r = await db.query("select public.article_body('aberta') as corpo");
      expect(r.rows[0].corpo).toBe("corpo livre");
    });
  });

  it("a função de corpo recusa premium para quem não paga", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "premium");
      await db.query(
        "update public.articles set is_premium = true, content = $1 where slug = 'premium'",
        [CORPO]
      );
      await actAs(db, ids.readerId);
      const r = await db.query("select public.article_body('premium') as corpo");
      expect(r.rows[0].corpo).toBeNull();
    });
  });

  it("a função de corpo entrega premium a quem paga", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "published", "premium");
      await db.query(
        "update public.articles set is_premium = true, content = $1 where slug = 'premium'",
        [CORPO]
      );
      await db.query("update public.profiles set plan = 'premium' where id = $1", [
        ids.readerId,
      ]);
      await actAs(db, ids.readerId);
      const r = await db.query("select public.article_body('premium') as corpo");
      expect(r.rows[0].corpo).toBe(CORPO);
    });
  });

  it("o autor lê o corpo do próprio rascunho pela função", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "meu-rascunho");
      await db.query("update public.articles set content = $1 where slug = 'meu-rascunho'", [
        "rascunho em andamento",
      ]);
      await actAs(db, ids.columnistId);
      const r = await db.query("select public.article_body('meu-rascunho') as corpo");
      expect(r.rows[0].corpo).toBe("rascunho em andamento");
    });
  });
});

describe("plano do assinante", () => {
  it("leitor NÃO se concede plano premium", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.readerId);

      const t = await tryWrite(db, "update public.profiles set plan = 'premium' where id = $1", [
        ids.readerId,
      ]);
      expect(t.ok).toBe(false);

      await actAsOwner(db);
      const r = await db.query("select plan from public.profiles where id = $1", [ids.readerId]);
      expect(r.rows[0].plan).toBe("free");
    });
  });

  it("leitor continua podendo editar o próprio nome", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.readerId);
      await db.query("update public.profiles set full_name = 'Novo Nome' where id = $1", [
        ids.readerId,
      ]);
      const r = await db.query("select full_name from public.profiles where id = $1", [
        ids.readerId,
      ]);
      expect(r.rows[0].full_name).toBe("Novo Nome");
    });
  });
});

describe("colunas comerciais da matéria", () => {
  it("colunista NÃO infla a contagem de leituras do próprio rascunho", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "meu");
      await actAs(db, ids.columnistId);

      const t = await tryWrite(
        db,
        "update public.articles set view_count = 999999 where slug = 'meu'"
      );
      expect(t.ok).toBe(false);

      await actAsOwner(db);
      const r = await db.query("select view_count from public.articles where slug = 'meu'");
      expect(Number(r.rows[0].view_count)).toBe(0);
    });
  });

  it("colunista NÃO decide se a própria matéria é paga", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "meu");
      await actAs(db, ids.columnistId);
      const t = await tryWrite(
        db,
        "update public.articles set is_premium = true where slug = 'meu'"
      );
      expect(t.ok).toBe(false);
    });
  });

  it("colunista edita título e corpo do próprio rascunho normalmente", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "meu");
      await actAs(db, ids.columnistId);
      await db.query(
        "update public.articles set title = 'Novo título', content = 'texto' where slug = 'meu'"
      );
      await actAsOwner(db);
      const r = await db.query("select title from public.articles where slug = 'meu'");
      expect(r.rows[0].title).toBe("Novo título");
    });
  });

  it("admin ajusta as colunas comerciais", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "meu");
      await actAs(db, ids.adminId);
      await db.query(
        "update public.articles set is_premium = true, view_count = 10 where slug = 'meu'"
      );
      await actAsOwner(db);
      const r = await db.query("select is_premium from public.articles where slug = 'meu'");
      expect(r.rows[0].is_premium).toBe(true);
    });
  });
});

describe("dados pessoais do colunista", () => {
  it("anônimo NÃO lê o e-mail dos autores", async () => {
    await withRollback(async (db) => {
      await seedUsers(db);
      await db.query("update public.authors set email = 'helena@pessoal.com' where slug = 'helena-braga'");
      await actAs(db, null);
      const t = await tryWrite(db, "select email from public.authors where slug = 'helena-braga'");
      expect(t.ok).toBe(false);
    });
  });

  it("anônimo continua lendo nome, bio e foto do autor", async () => {
    await withRollback(async (db) => {
      await seedUsers(db);
      await actAs(db, null);
      const r = await db.query(
        "select name, slug, bio, avatar_url from public.authors where slug = 'helena-braga'"
      );
      expect(r.rows[0].name).toBe("Helena Braga");
    });
  });
});

describe("identidade de serviço", () => {
  it("service_role atribui papel — é o caminho real do convite", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ role: "service_role" }),
      ]);
      await db.exec("set local role service_role");

      await db.query("update public.profiles set role = 'columnist' where id = $1", [
        ids.readerId,
      ]);

      await actAsOwner(db);
      const r = await db.query("select role from public.profiles where id = $1", [ids.readerId]);
      expect(r.rows[0].role).toBe("columnist");
    });
  });
});
