import { afterAll, describe, expect, it } from "vitest";
import { actAs, pool, withRollback } from "../helpers/db";

afterAll(async () => {
  await pool.end();
});

describe("base da RLS", () => {
  it("a conexão de teste funciona e enxerga o esquema do projeto", async () => {
    await withRollback(async (client) => {
      const result = await client.query(
        `select table_name from information_schema.tables
          where table_schema = 'public' and table_name = 'articles'`
      );
      expect(result.rowCount).toBe(1);
    });
  });

  it("trocar de identidade muda o papel efetivo do Postgres", async () => {
    await withRollback(async (client) => {
      await actAs(client, null);
      const result = await client.query("select current_user as papel");
      expect(result.rows[0].papel).toBe("anon");
    });
  });

  it("a função current_role ainda NÃO existe — alvo da Task 2", async () => {
    await withRollback(async (client) => {
      const result = await client.query(
        `select routine_name from information_schema.routines
          where routine_schema = 'public' and routine_name = 'current_role'`
      );
      expect(result.rowCount).toBe(1);
    });
  });
});
