import { afterAll, describe, expect, it } from "vitest";
import { actAs, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(closeDb);

describe("RLS da biblioteca de mídia", () => {
  it("colunista enxerga mídia enviada por outra pessoa", async () => {
    // Biblioteca compartilhada: obrigar cada um a ressubir a mesma foto
    // geraria duplicata e desperdiçaria armazenamento.
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/do-admin.webp', 'Foto enviada pelo admin', $1)`,
        [ids.adminId]
      );
      await actAs(db, ids.columnistId);
      const r = await db.query(
        "select id from public.media_assets where storage_path = 'media/do-admin.webp'"
      );
      expect(r.rowCount).toBe(1);
    });
  });

  it("colunista envia mídia", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);
      await db.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/do-colunista.webp', 'Gráfico de sinistralidade', $1)`,
        [ids.columnistId]
      );
      const r = await db.query(
        "select id from public.media_assets where storage_path = 'media/do-colunista.webp'"
      );
      expect(r.rowCount).toBe(1);
    });
  });

  it("colunista NÃO apaga mídia — remover arquivo em uso quebra matéria alheia", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/em-uso.webp', 'Imagem usada por outra matéria', $1)`,
        [ids.adminId]
      );
      await actAs(db, ids.columnistId);

      const t = await tryWrite(
        db,
        "delete from public.media_assets where storage_path = 'media/em-uso.webp'"
      );
      expect(t.rowCount).toBe(0);
    });
  });

  it("admin apaga mídia", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/descartavel.webp', 'Imagem a remover', $1)`,
        [ids.adminId]
      );
      await actAs(db, ids.adminId);
      await db.query(
        "delete from public.media_assets where storage_path = 'media/descartavel.webp'"
      );
      const r = await db.query(
        "select id from public.media_assets where storage_path = 'media/descartavel.webp'"
      );
      expect(r.rowCount).toBe(0);
    });
  });

  it("leitor NÃO enxerga a biblioteca", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/privada.webp', 'Imagem qualquer', $1)`,
        [ids.adminId]
      );
      await actAs(db, ids.readerId);
      const r = await db.query("select id from public.media_assets");
      expect(r.rowCount).toBe(0);
    });
  });

  it("anônimo NÃO enxerga a biblioteca", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.media_assets (storage_path, alt, uploaded_by)
         values ('media/privada.webp', 'Imagem qualquer', $1)`,
        [ids.adminId]
      );
      await actAs(db, null);
      const r = await db.query("select id from public.media_assets");
      expect(r.rowCount).toBe(0);
    });
  });

  it("tags são públicas para leitura", async () => {
    await withRollback(async (db) => {
      await seedUsers(db);
      await db.query("insert into public.tags (slug, label) values ('susep', 'SUSEP')");
      await actAs(db, null);
      const r = await db.query("select id from public.tags where slug = 'susep'");
      expect(r.rowCount).toBe(1);
    });
  });

  it("colunista NÃO cria tag — vocabulário é do veículo", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await actAs(db, ids.columnistId);
      const t = await tryWrite(
        db,
        "insert into public.tags (slug, label) values ('inventada', 'Inventada')"
      );
      expect(t.ok).toBe(false);
    });
  });
});
