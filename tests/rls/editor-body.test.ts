import { afterAll, describe, expect, it } from "vitest";
import { actAs, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedArticle, seedUsers } from "../helpers/seed";

afterAll(closeDb);

/**
 * O corpo da matéria visto de DENTRO do painel.
 *
 * A migração que fechou o paywall revogou `select` na tabela `articles` e
 * reconcedeu coluna a coluna, deixando `content`, `content_json` e
 * `content_text` de fora. Isso vale para `authenticated` — e o admin é
 * `authenticated`. O editor, que lia `content_json` direto da tabela, passou
 * a receber 42501, a matéria vinha nula e a página caía em 404.
 *
 * O caminho legítimo é uma função `security definer` que devolve o corpo a
 * quem tem direito de EDITAR — que não é o mesmo conjunto de quem tem
 * direito de LER. `article_body_json` serve o leitor e é chaveada por slug;
 * esta serve o editor e é chaveada por id, porque no painel o slug é campo
 * editável e não identifica a matéria de forma estável.
 */

const CORPO = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Miolo da matéria." }] }] };

async function comCorpo(db: Parameters<typeof seedArticle>[0], id: string) {
  await db.query("update public.articles set content_json = $1::jsonb where id = $2", [
    JSON.stringify(CORPO),
    id,
  ]);
}

describe("leitura do corpo dentro do painel", () => {
  it("o admin NÃO alcança content_json direto na tabela — é por isso que a função existe", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const id = await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho-x");
      await comCorpo(db, id);

      await actAs(db, ids.adminId);
      const t = await tryWrite(db, "select content_json from public.articles limit 1");
      expect(t.ok).toBe(false);
    });
  });

  it("o admin recebe o corpo de qualquer matéria pela função", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const id = await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho-x");
      await comCorpo(db, id);

      await actAs(db, ids.adminId);
      const r = await db.query("select public.article_body_for_edit($1) as corpo", [id]);
      expect(JSON.stringify(r.rows[0].corpo)).toContain("Miolo da matéria.");
    });
  });

  it("o colunista recebe o corpo do PRÓPRIO rascunho", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const id = await seedArticle(db, ids.columnistAuthorId, "draft", "rascunho-x");
      await comCorpo(db, id);

      await actAs(db, ids.columnistId);
      const r = await db.query("select public.article_body_for_edit($1) as corpo", [id]);
      expect(JSON.stringify(r.rows[0].corpo)).toContain("Miolo da matéria.");
    });
  });

  it("o colunista NÃO recebe o corpo do rascunho de outro", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const id = await seedArticle(db, ids.otherAuthorId, "draft", "rascunho-alheio");
      await comCorpo(db, id);

      await actAs(db, ids.columnistId);
      const r = await db.query("select public.article_body_for_edit($1) as corpo", [id]);
      expect(r.rows[0].corpo).toBeNull();
    });
  });

  it("o leitor NÃO recebe o corpo nem de matéria publicada — esta porta é do painel", async () => {
    // Quem lê o site usa `article_body_json`, que respeita o paywall. Esta
    // função é outra porta: não existe leitor do lado de dentro.
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const id = await seedArticle(db, ids.columnistAuthorId, "published", "publicada");
      await comCorpo(db, id);

      await actAs(db, ids.readerId);
      const r = await db.query("select public.article_body_for_edit($1) as corpo", [id]);
      expect(r.rows[0].corpo).toBeNull();
    });
  });

  it("o anônimo nem consegue CHAMAR a função — a porta não é dele", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const id = await seedArticle(db, ids.columnistAuthorId, "published", "publicada");
      await comCorpo(db, id);

      await actAs(db, null);
      const t = await tryWrite(db, `select public.article_body_for_edit('${id}'::uuid)`);
      expect(t.ok).toBe(false);
    });
  });

  it("matéria recém-criada devolve o documento vazio, não nulo — o editor precisa distinguir", async () => {
    // Diferença que evita perda de dados: nulo significa "não pude ler" e o
    // editor recusa abrir; documento vazio significa "ainda não tem texto".
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const id = await seedArticle(db, ids.columnistAuthorId, "draft", "nova");
      await db.query("update public.articles set content_json = null where id = $1", [id]);

      await actAs(db, ids.adminId);
      const r = await db.query("select public.article_body_for_edit($1) as corpo", [id]);
      // Um `doc` sem parágrafo é inválido para o esquema do editor, não vazio.
      expect(r.rows[0].corpo).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    });
  });
});
