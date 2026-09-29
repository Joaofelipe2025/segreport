import { afterAll, describe, expect, it } from "vitest";
import { actAs, actAsOwner, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(closeDb);

const INSERE = `insert into public.pautas (fonte, tipo_de_fonte, titulo, url)
                values ('cqcs', 'imprensa', 'Uma pauta', 'https://cqcs.com.br/n/1')`;

describe("pautas", () => {
  it("só o admin lê", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(INSERE);

      await actAs(db, ids.adminId);
      expect((await db.query("select id from public.pautas")).rows).toHaveLength(1);

      await actAs(db, ids.columnistId);
      expect((await db.query("select id from public.pautas")).rows).toHaveLength(0);

      await actAs(db, null);
      expect((await db.query("select id from public.pautas")).rows).toHaveLength(0);
    });
  });

  it("a mesma URL não entra duas vezes", async () => {
    await withRollback(async (db) => {
      await db.query(INSERE);
      const t = await tryWrite(db, INSERE);
      expect(t.ok).toBe(false);
    });
  });

  it("estado fora da lista é recusado pelo banco", async () => {
    await withRollback(async (db) => {
      const t = await tryWrite(
        db,
        `insert into public.pautas (fonte, tipo_de_fonte, titulo, url, estado)
         values ('cqcs', 'imprensa', 'T', 'https://x.test/a', 'inventado')`
      );
      expect(t.ok).toBe(false);
    });
  });

  it("tipo de fonte fora da lista é recusado pelo banco", async () => {
    await withRollback(async (db) => {
      const t = await tryWrite(
        db,
        `insert into public.pautas (fonte, tipo_de_fonte, titulo, url)
         values ('cqcs', 'blog', 'T', 'https://x.test/a')`
      );
      expect(t.ok).toBe(false);
    });
  });

  it("o admin muda o estado de uma pauta", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(INSERE);
      await actAs(db, ids.adminId);
      const t = await tryWrite(db, "update public.pautas set estado = 'lida'");
      expect(t.ok).toBe(true);
    });
  });

  it("o colunista NÃO muda estado de pauta", async () => {
    // A asserção que importa é ler a linha COMO DONO depois da tentativa —
    // não basta o `rowCount` da própria escrita nem, muito menos, o select
    // do colunista logo em seguida. Este último não prova nada: voltaria
    // vazio mesmo com a policy de update escancarada, porque é a policy de
    // SELECT que esconde a linha de quem não é admin — o update podia ter
    // passado por baixo dela. `rowCount` ajuda, mas só depois de
    // tests/helpers/db.ts refletir linhas afetadas de verdade (ver conserto
    // de rowCount); a leitura como dono é a prova que não depende disso.
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(INSERE);
      await actAs(db, ids.columnistId);

      const t = await tryWrite(db, "update public.pautas set estado = 'lida'");
      expect(t.rowCount).toBe(0);

      await actAsOwner(db);
      const r = await db.query("select estado from public.pautas");
      expect(r.rows[0].estado).toBe("nova");
    });
  });
});

describe("registro de execução", () => {
  it("grava execução SEM achado nenhum — é o caso que importa", async () => {
    // Dia calmo e três feeds quebrados produzem o mesmo vazio em `pautas`.
    // Só esta linha distingue os dois.
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.vigia_execucoes (achados, falhas)
         values ('{"cqcs":0}'::jsonb, '{"apolice":"HTTP 503"}'::jsonb)`
      );
      await actAs(db, ids.adminId);
      const r = await db.query("select falhas from public.vigia_execucoes");
      expect(r.rows).toHaveLength(1);
      expect(JSON.stringify(r.rows[0].falhas)).toContain("503");
    });
  });

  it("só o admin lê as execuções", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query("insert into public.vigia_execucoes default values");
      await actAs(db, ids.columnistId);
      expect((await db.query("select id from public.vigia_execucoes")).rows).toHaveLength(0);
    });
  });
});
