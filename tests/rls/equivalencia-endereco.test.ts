import { afterAll, describe, expect, it } from "vitest";
import { actAsOwner, closeDb, tryWrite, withRollback } from "../helpers/db";
import { enderecoDeCredito } from "@/lib/portal/credito";

afterAll(closeDb);

/**
 * O check do banco e `enderecoDeCredito` precisam concordar. Se o banco
 * aceita o que a página não renderiza, sai matéria derivada sem atribuição;
 * se recusa o que a rota aceita, o insert estoura e o agente reenvia em laço.
 */
const CASOS: Array<[string, boolean]> = [
  ["https://cqcs.com.br/n/1", true],
  ["http://exemplo.com", true],
  ["https://www.cqcs.com.br?a=1", true],
  ["https://exemplo.com#topo", true],
  ["https://exemplo.com:8080/x", true],
  ["https://segurosé.com.br/x", true],
  ["https://exemplo.xn--p1ai/x", true],
  ["https://1.2.3.4", true],
  ["https://u:p@cqcs.com.br/n", true],
  ["https://cqcs.com.br@evil.com/n", true],
  ["https://a.com\\x", true],
  ["https://a..com/x", true],
  ["https://", false],
  ["http://", false],
  ["https://?a=1", false],
  ["https://localhost/x", false],
  ["https://a.com/b c", false],
  ["https://a.com/?q=a b", false],
  ["https://a.com/\tx", false],
  ["https://a.com#a b", false],
  ["https://a.com/ x", false],
  ["javascript:alert(1)", false],
  ["ftp://x.com/a", false],
  ["https://.com", false],
  ["https://a./x", false],
  ["https://a.com:99999/x", false],
  ["https://a.com:80x/x", false],
  ["https://[::1]/x", false],
  ["nem-url", false],
];

describe("o check do banco concorda com enderecoDeCredito", () => {
  it("os mesmos casos, os dois lados", async () => {
    const divergentes: string[] = [];
    await withRollback(async (db) => {
      await actAsOwner(db);
      let i = 0;
      for (const [url, esperado] of CASOS) {
        const codigo = enderecoDeCredito(url);
        const t = await tryWrite(
          db,
          `insert into public.articles (slug, title, status, origem, fonte_original_url)
           values ('eq${i++}', 'Eq', 'draft', 'derivada', $$${url}$$)`
        );
        if (codigo !== esperado || t.ok !== esperado) {
          divergentes.push(`${JSON.stringify(url)} esperado=${esperado} codigo=${codigo} banco=${t.ok}`);
        }
      }
    });
    expect(divergentes).toEqual([]);
  });
});
