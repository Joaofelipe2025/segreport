import { afterAll, describe, expect, it } from "vitest";
import { actAs, actAsOwner, closeDb, tryWrite, withRollback } from "../helpers/db";

afterAll(closeDb);

describe("procedência da matéria", () => {
  it("derivada SEM fonte é recusada pelo banco", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, origem)
         values ('d1', 'Derivada sem fonte', 'draft', 'derivada')`
      );
      expect(t.ok).toBe(false);
      expect(t.error).toMatch(/derivada_tem_fonte/);
    });
  });

  it("derivada COM fonte entra", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, origem, fonte_original_url)
         values ('d2', 'Derivada com fonte', 'draft', 'derivada', 'https://cqcs.com.br/n/1')`
      );
      expect(t.ok).toBe(true);
    });
  });

  it("origem inventada é recusada", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, origem)
         values ('d3', 'Origem torta', 'draft', 'copiada')`
      );
      expect(t.ok).toBe(false);
      expect(t.error).toMatch(/origem_valida/);
    });
  });

  it("release e primaria não exigem fonte", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      for (const o of ["release", "primaria"]) {
        const t = await tryWrite(
          db,
          `insert into public.articles (slug, title, status, origem)
           values ('${o}-1', 'Matéria', 'draft', '${o}')`
        );
        expect(t.ok, o).toBe(true);
      }
    });
  });

  it("matéria escrita à mão continua entrando sem origem", async () => {
    // O caminho manual não muda. Se esta falhar, quebramos o CMS.
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status)
         values ('manual-1', 'Escrita por uma pessoa', 'draft')`
      );
      expect(t.ok).toBe(true);
    });
  });

  it("fonte que não é http(s) é recusada", async () => {
    // Única defesa contra `javascript:` virar <a href> clicável no crédito.
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, origem, fonte_original_url)
         values ('h1', 'Fonte maliciosa', 'draft', 'derivada', 'javascript:alert(1)')`
      );
      expect(t.ok).toBe(false);
      expect(t.error).toMatch(/fonte_eh_http/);
    });
  });

  it("fonte feita só de espaços é recusada", async () => {
    // Passa o `is not null` da regra da derivada; precisa cair no http.
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, origem, fonte_original_url)
         values ('h2', 'Fonte em branco', 'draft', 'derivada', '   ')`
      );
      expect(t.ok).toBe(false);
      expect(t.error).toMatch(/fonte_eh_http/);
    });
  });

  it("precisa_checagem é legível por usuário autenticado", async () => {
    // O painel admin lê como `authenticated`; a fila de checagem depende disto.
    await withRollback(async (db) => {
      await actAs(db, "00000000-0000-0000-0000-0000000000aa");
      const t = await tryWrite(db, `select precisa_checagem from public.articles limit 1`);
      expect(t.ok).toBe(true);
    });
  });

  it("precisa_checagem NÃO é legível pelo público", async () => {
    // Dizer ao leitor que uma matéria publicada não foi checada é pior do
    // que não publicá-la. É informação de redação.
    await withRollback(async (db) => {
      await actAs(db, null);
      const t = await tryWrite(db, `select precisa_checagem from public.articles limit 1`);
      expect(t.ok).toBe(false);
      expect(t.error).toMatch(/permission denied/i);
    });
  });

  it("o crédito É legível pelo público", async () => {
    await withRollback(async (db) => {
      await actAs(db, null);
      const t = await tryWrite(
        db,
        `select fonte_original_url, fonte_original_nome, origem
           from public.articles limit 1`
      );
      expect(t.ok).toBe(true);
    });
  });

  it("pautas aceita o estado em_producao", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.pautas (fonte, tipo_de_fonte, titulo, url, estado)
         values ('cqcs', 'imprensa', 'T', 'https://x.test/1', 'em_producao')`
      );
      expect(t.ok).toBe(true);
    });
  });
});
