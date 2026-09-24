import { afterAll, describe, expect, it } from "vitest";
import { actAs, backendName, closeDb, withRollback } from "../helpers/db";

afterAll(closeDb);

describe(`base da RLS (${backendName()})`, () => {
  it("as migrações existentes foram aplicadas", async () => {
    await withRollback(async (db) => {
      const r = await db.query(
        `select table_name from information_schema.tables
          where table_schema = 'public' and table_name = 'articles'`
      );
      expect(r.rowCount).toBe(1);
    });
  });

  it("trocar de identidade muda o papel efetivo", async () => {
    await withRollback(async (db) => {
      await actAs(db, null);
      const r = await db.query("select current_user as papel");
      expect(r.rows[0].papel).toBe("anon");
    });
  });

  it("auth.uid() devolve o sub declarado na sessão", async () => {
    await withRollback(async (db) => {
      const id = "11111111-1111-4111-8111-111111111111";
      await actAs(db, id);
      const r = await db.query("select auth.uid()::text as uid");
      expect(r.rows[0].uid).toBe(id);
    });
  });

  it("a função current_role ainda NÃO existe — alvo da Task 2", async () => {
    await withRollback(async (db) => {
      const r = await db.query(
        `select routine_name from information_schema.routines
          where routine_schema = 'public' and routine_name = 'current_role'`
      );
      expect(r.rowCount).toBe(1);
    });
  });
});
