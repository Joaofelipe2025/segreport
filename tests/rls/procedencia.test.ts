import { afterAll, describe, expect, it } from "vitest";
import { actAs, actAsOwner, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedArticle, seedUsers } from "../helpers/seed";

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

  it.each([["https://"], ["http://"], ["https://?a=1"], ["https://localhost/x"]])(
    "fonte sem domínio %j é recusada",
    async (url) => {
      // A página não extrai domínio daqui: aceitar publicaria derivada sem crédito.
      await withRollback(async (db) => {
        await actAsOwner(db);
        const t = await tryWrite(
          db,
          `insert into public.articles (slug, title, status, origem, fonte_original_url)
           values ('sd', 'Sem domínio', 'draft', 'derivada', '${url}')`
        );
        expect(t.ok).toBe(false);
        expect(t.error).toMatch(/fonte_eh_http/);
      });
    }
  );

  it("fonte com domínio, porta, consulta e âncora passa", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      let i = 0;
      for (const url of [
        "https://cqcs.com.br/n/1",
        "https://www.cqcs.com.br",
        "http://exemplo.com?a=1",
        "https://exemplo.com#topo",
        "https://exemplo.com:8080/x",
      ]) {
        const t = await tryWrite(
          db,
          `insert into public.articles (slug, title, status, origem, fonte_original_url)
           values ('ok${i++}', 'Com domínio', 'draft', 'derivada', '${url}')`
        );
        expect(t.ok, url).toBe(true);
      }
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

  describe("a marca de procedência não é apagável por quem não é admin", () => {
    const CAMPOS: Array<[string, string]> = [
      ["precisa_checagem", "precisa_checagem = false"],
      ["origem", "origem = 'release'"],
      ["fonte_original_url", "fonte_original_url = 'https://outro.com.br/x'"],
      ["fonte_original_nome", "fonte_original_nome = 'Outro'"],
    ];

    const semear = async (db: Parameters<typeof seedUsers>[0]) => {
      const ids = await seedUsers(db);
      const id = await seedArticle(db, ids.columnistAuthorId, "draft", "marcada");
      await db.query(
        `update public.articles
            set origem = 'derivada', fonte_original_url = 'https://cqcs.com.br/n/1',
                fonte_original_nome = 'CQCS', precisa_checagem = true
          where id = $1`,
        [id]
      );
      return { ids, id };
    };

    it.each(CAMPOS)("colunista NÃO muda %s da própria matéria", async (campo, atribuicao) => {
      await withRollback(async (db) => {
        const { ids, id } = await semear(db);
        await actAs(db, ids.columnistId);
        const t = await tryWrite(db, `update public.articles set ${atribuicao} where id = '${id}'`);
        expect(t.ok, campo).toBe(false);
        await actAsOwner(db);
        const r = await db.query(
          `select origem, fonte_original_url, fonte_original_nome, precisa_checagem
             from public.articles where id = $1`,
          [id]
        );
        expect(r.rows[0]).toEqual({
          origem: "derivada",
          fonte_original_url: "https://cqcs.com.br/n/1",
          fonte_original_nome: "CQCS",
          precisa_checagem: true,
        });
      });
    });

    it.each(CAMPOS)("admin muda %s", async (campo, atribuicao) => {
      await withRollback(async (db) => {
        const { ids, id } = await semear(db);
        await actAs(db, ids.adminId);
        const t = await tryWrite(db, `update public.articles set ${atribuicao} where id = '${id}'`);
        expect(t.ok, campo).toBe(true);
      });
    });
  });

  it("pautas tem carimbo de atualização, e o gatilho o move ao reservar", async () => {
    // Sem ele a reserva (`em_producao`) não tem como expirar: só haveria
    // `criado_em`, que nunca muda, e toda pauta antiga pareceria vencida.
    await withRollback(async (db) => {
      await actAsOwner(db);
      const ins = await tryWrite(
        db,
        `insert into public.pautas (fonte, tipo_de_fonte, titulo, url, updated_at)
         values ('cqcs', 'imprensa', 'T', 'https://x.test/carimbo', '2020-01-01T00:00:00Z')`
      );
      expect(ins.ok).toBe(true);
      const up = await tryWrite(db, `update public.pautas set estado = 'em_producao'`);
      expect(up.ok).toBe(true);
      const r = await db.query(
        `select updated_at > '2020-01-02T00:00:00Z' as moveu from public.pautas`
      );
      expect(r.rows[0].moveu).toBe(true);
    });
  });

  it("pauta nova nasce com o carimbo preenchido", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      await tryWrite(
        db,
        `insert into public.pautas (fonte, tipo_de_fonte, titulo, url)
         values ('cqcs', 'imprensa', 'T', 'https://x.test/nasce')`
      );
      const r = await db.query(`select updated_at is not null as ok from public.pautas`);
      expect(r.rows[0].ok).toBe(true);
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
