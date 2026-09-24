import { afterAll, describe, expect, it } from "vitest";
import { actAs, actAsOwner, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(closeDb);

describe("perfis e papéis", () => {
  it("current_role devolve o papel de quem está pedindo", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);
      const r = await db.query("select public.current_role() as role");
      expect(r.rows[0].role).toBe("columnist");
    });
  });

  it("is_admin distingue admin de colunista", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.adminId);
      const r = await db.query("select public.is_admin() as ok");
      expect(r.rows[0].ok).toBe(true);
    });

    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);
      const r = await db.query("select public.is_admin() as ok");
      expect(r.rows[0].ok).toBe(false);
    });
  });

  it("current_author_id encontra a assinatura pública do colunista", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);
      const r = await db.query("select public.current_author_id()::text as id");
      expect(r.rows[0].id).toBe(ids.columnistAuthorId);
    });
  });

  it("current_author_id é nulo para quem não é colunista", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.readerId);
      const r = await db.query("select public.current_author_id() as id");
      expect(r.rows[0].id).toBeNull();
    });
  });

  it("autor sem conta é permitido — a redação assina sem login", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      const r = await db.query(
        "select profile_id from public.authors where id = $1",
        [ids.adminAuthorId]
      );
      expect(r.rows[0].profile_id).toBeNull();
    });
  });

  it("o servidor atribui papel sem sessão — é assim que o convite funciona", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      // Sem actAs: nenhuma sessão, como na ação de convite que roda com a
      // chave de serviço. A trava de escalada não pode barrar este caminho.
      await db.query("update public.profiles set role = 'columnist' where id = $1", [
        ids.readerId,
      ]);
      const r = await db.query("select role from public.profiles where id = $1", [
        ids.readerId,
      ]);
      expect(r.rows[0].role).toBe("columnist");
    });
  });

  it("colunista NÃO consegue se promover a admin", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);

      const tentativa = await tryWrite(
        db,
        "update public.profiles set role = 'admin' where id = $1",
        [ids.columnistId]
      );
      expect(tentativa.ok).toBe(false);
      expect(tentativa.error).toMatch(/apenas administradores alteram papel/);

      await actAsOwner(db);
      const r = await db.query("select role from public.profiles where id = $1", [
        ids.columnistId,
      ]);
      expect(r.rows[0].role).toBe("columnist");
    });
  });
});
