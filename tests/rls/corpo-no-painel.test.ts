import { afterAll, describe, expect, it } from "vitest";
import { actAs, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedArticle, seedUsers } from "../helpers/seed";

afterAll(closeDb);

/**
 * O corpo da matéria dentro do painel, pela função que JÁ EXISTE.
 *
 * Houve uma tentativa de criar `article_body_for_edit(id)`, chaveada por id
 * em vez de slug. Ela era ligeiramente melhor — no painel o slug é campo
 * editável — mas exigia aplicar DDL à mão no Supabase, e enquanto isso não
 * acontecia o editor não abria matéria nenhuma. Passo manual que trava o
 * produto é pior do que a imperfeição que ele corrigia.
 *
 * `article_body_json` cobre o caso: o mesmo ramo `is_admin() or
 * author_id = current_author_id()`. O que ela tem a mais — devolver corpo de
 * matéria publicada e aberta a qualquer um — é irrelevante no painel, e o
 * direito de EDITAR é conferido separadamente por `podeEditarMateria`, que
 * espelha a RLS de escrita. Ver tests/painel/permissao.test.ts.
 */

const CORPO = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Miolo da matéria." }] }],
};

async function comCorpo(db: Parameters<typeof seedArticle>[0], slug: string) {
  await db.query("update public.articles set content_json = $1::jsonb where slug = $2", [
    JSON.stringify(CORPO),
    slug,
  ]);
}

describe("o painel alcança o corpo por article_body_json", () => {
  it("o admin NÃO alcança content_json direto na tabela — é por isso que a função existe", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho-x");
      await comCorpo(db, "rascunho-x");

      await actAs(db, ids.adminId);
      const t = await tryWrite(db, "select content_json from public.articles limit 1");
      expect(t.ok).toBe(false);
    });
  });

  it("o admin recebe o corpo de rascunho alheio — é ele quem revisa", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho-x");
      await comCorpo(db, "rascunho-x");

      await actAs(db, ids.adminId);
      const r = await db.query("select public.article_body_json($1) as corpo", ["rascunho-x"]);
      expect(JSON.stringify(r.rows[0].corpo)).toContain("Miolo da matéria.");
    });
  });

  it("o colunista recebe o corpo do PRÓPRIO rascunho", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho-x");
      await comCorpo(db, "rascunho-x");

      await actAs(db, ids.columnistId);
      const r = await db.query("select public.article_body_json($1) as corpo", ["rascunho-x"]);
      expect(JSON.stringify(r.rows[0].corpo)).toContain("Miolo da matéria.");
    });
  });

  it("o colunista NÃO recebe o corpo do rascunho de outro", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.otherAuthorId, "draft", "rascunho-alheio");
      await comCorpo(db, "rascunho-alheio");

      await actAs(db, ids.columnistId);
      const r = await db.query("select public.article_body_json($1) as corpo", [
        "rascunho-alheio",
      ]);
      expect(r.rows[0].corpo).toBeNull();
    });
  });

  it("o anônimo NÃO recebe o corpo de rascunho nenhum", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho-x");
      await comCorpo(db, "rascunho-x");

      await actAs(db, null);
      const r = await db.query("select public.article_body_json($1) as corpo", ["rascunho-x"]);
      expect(r.rows[0].corpo).toBeNull();
    });
  });

  it("matéria sem texto ainda devolve nulo, e o editor abre vazia", async () => {
    // Aqui nulo é ausência legítima, e quem distingue é o código: o direito
    // já foi conferido antes da chamada, e erro de consulta é tratado à parte.
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await seedArticle(db, ids.columnistAuthorId, "draft", "nova");

      await actAs(db, ids.adminId);
      const r = await db.query("select public.article_body_json($1) as corpo", ["nova"]);
      expect(r.rows[0].corpo).toBeNull();
    });
  });
});
