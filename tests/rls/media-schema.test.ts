import { afterAll, describe, expect, it } from "vitest";
import { closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(closeDb);

describe("esquema de mídia e tags", () => {
  it("exige texto alternativo com pelo menos três caracteres", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const t = await tryWrite(
        db,
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/foto.webp', '  ', $1)`,
        [ids.adminId]
      );
      expect(t.ok).toBe(false);
    });
  });

  it("aceita mídia com texto alternativo válido", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.media_assets
           (storage_path, alt, credit, width, height, bytes, uploaded_by)
         values ('media/foto.webp', 'Fachada da sede da SUSEP', 'Divulgação', 1600, 900, 240000, $1)`,
        [ids.adminId]
      );
      const r = await db.query(
        "select alt, width from public.media_assets where storage_path = 'media/foto.webp'"
      );
      expect(r.rows[0].alt).toBe("Fachada da sede da SUSEP");
      expect(r.rows[0].width).toBe(1600);
    });
  });

  it("não aceita o mesmo caminho de armazenamento duas vezes", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/unica.webp', 'Uma imagem qualquer', $1)`,
        [ids.adminId]
      );
      const t = await tryWrite(
        db,
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/unica.webp', 'Outra descrição', $1)`,
        [ids.adminId]
      );
      expect(t.ok).toBe(false);
    });
  });

  it("liga matéria a tag sem permitir duplicata", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const artigo = await db.query(
        `insert into public.articles (slug, title, status, author_id)
         values ('com-tag', 'T', 'draft', $1) returning id`,
        [ids.columnistAuthorId]
      );
      const tag = await db.query(
        `insert into public.tags (slug, label)
         values ('open-insurance', 'Open Insurance') returning id`
      );
      const artigoId = artigo.rows[0].id;
      const tagId = tag.rows[0].id;

      await db.query(
        "insert into public.article_tags (article_id, tag_id) values ($1, $2)",
        [artigoId, tagId]
      );
      const t = await tryWrite(
        db,
        "insert into public.article_tags (article_id, tag_id) values ($1, $2)",
        [artigoId, tagId]
      );
      expect(t.ok).toBe(false);
    });
  });

  it("apagar a matéria leva junto o vínculo com a tag, mas não a tag", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const artigo = await db.query(
        `insert into public.articles (slug, title, status, author_id)
         values ('some-depois', 'T', 'draft', $1) returning id`,
        [ids.columnistAuthorId]
      );
      const tag = await db.query(
        `insert into public.tags (slug, label) values ('cyber', 'Cyber') returning id`
      );
      await db.query(
        "insert into public.article_tags (article_id, tag_id) values ($1, $2)",
        [artigo.rows[0].id, tag.rows[0].id]
      );

      await db.query("delete from public.articles where slug = 'some-depois'");

      const vinculos = await db.query("select * from public.article_tags");
      const tags = await db.query("select * from public.tags where slug = 'cyber'");
      expect(vinculos.rowCount).toBe(0);
      expect(tags.rowCount).toBe(1);
    });
  });
});
