import { afterAll, describe, expect, it } from "vitest";
import { closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(closeDb);

describe("esquema de matérias", () => {
  it("aceita os cinco estados da máquina", async () => {
    const estados = ["draft", "in_review", "scheduled", "published", "archived"];

    for (const estado of estados) {
      await withRollback(async (db) => {
        const ids = await seedUsers(db);
        await db.query(
          `insert into public.articles (slug, title, status, author_id, scheduled_for)
           values ($1, 'Título de teste', $2, $3,
                   case when $2 = 'scheduled' then now() + interval '1 day' else null end)`,
          [`teste-${estado}`, estado, ids.columnistAuthorId]
        );
        const r = await db.query(
          "select status from public.articles where slug = $1",
          [`teste-${estado}`]
        );
        expect(r.rows[0].status).toBe(estado);
      });
    }
  });

  it("recusa um estado inventado", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id)
         values ('teste-invalido', 'T', 'publicado_talvez', $1)`,
        [ids.columnistAuthorId]
      );
      expect(t.ok).toBe(false);
    });
  });

  it("matéria agendada exige horário", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, author_id)
         values ('agendada-sem-hora', 'T', 'scheduled', $1)`,
        [ids.columnistAuthorId]
      );
      expect(t.ok).toBe(false);
    });
  });

  it("guarda o documento de blocos, o texto derivado e a linha de apoio", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const doc = {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Olá mercado." }] },
        ],
      };
      await db.query(
        `insert into public.articles
           (slug, title, status, author_id, content_json, content_text, standfirst)
         values ('teste-doc', 'T', 'draft', $1, $2, $3, $4)`,
        [ids.columnistAuthorId, JSON.stringify(doc), "Olá mercado.", "Linha de apoio"]
      );
      const r = await db.query(
        "select content_json, content_text, standfirst from public.articles where slug = 'teste-doc'"
      );
      const guardado =
        typeof r.rows[0].content_json === "string"
          ? JSON.parse(r.rows[0].content_json)
          : r.rows[0].content_json;
      expect(guardado.content[0].type).toBe("paragraph");
      expect(r.rows[0].content_text).toBe("Olá mercado.");
      expect(r.rows[0].standfirst).toBe("Linha de apoio");
    });
  });

  it("guarda metadados de SEO e agendamento", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.articles
           (slug, title, status, author_id, seo_title, seo_description, updated_by)
         values ('teste-seo', 'T', 'draft', $1, 'Título para busca', 'Resumo para busca', $2)`,
        [ids.columnistAuthorId, ids.adminId]
      );
      const r = await db.query(
        "select seo_title, seo_description, updated_by from public.articles where slug = 'teste-seo'"
      );
      expect(r.rows[0].seo_title).toBe("Título para busca");
      expect(r.rows[0].updated_by).toBe(ids.adminId);
    });
  });
});
