import { describe, expect, it } from "vitest";
import { FONTES, fontePorChave } from "@/lib/vigia/fontes";

describe("as fontes da etapa 1", () => {
  it("são os três feeds que respondem", () => {
    expect(FONTES.map((f) => f.chave).sort()).toEqual([
      "apolice",
      "cqcs",
      "sonho-seguro",
    ]);
  });

  it("todas são de imprensa nesta etapa", () => {
    // Fonte primária entra nas etapas 2 e 3. Enquanto só há imprensa,
    // nenhum caminho gera matéria — que é a CON-1.
    expect(FONTES.every((f) => f.tipo === "imprensa")).toBe(true);
  });

  it("toda fonte tem endereço https", () => {
    for (const f of FONTES) expect(f.url, f.chave).toMatch(/^https:\/\//);
  });

  it("as chaves não se repetem", () => {
    expect(new Set(FONTES.map((f) => f.chave)).size).toBe(FONTES.length);
  });

  it("chave desconhecida devolve nulo, não estoura", () => {
    expect(fontePorChave("inventada")).toBeNull();
    expect(fontePorChave("")).toBeNull();
    expect(fontePorChave("__proto__")).toBeNull();
  });

  it("chave conhecida devolve a fonte", () => {
    expect(fontePorChave("cqcs")?.nome).toBe("CQCS");
  });
});

/**
 * O script do vigia roda no GitHub Actions, sem o build do Next, e por isso
 * duplica a lista de fontes e o parse. Duplicação que ninguém compara é
 * duplicação que já divergiu — e aqui ela divergiu uma vez: a primeira
 * versão do script decodificava uma lista fixa de entidades nomeadas e
 * deixava `&#038;` chegar cru ao painel, em 2 dos 50 títulos do CQCS.
 *
 * Por isso a comparação não é textual. As duas cópias rodam contra as mesmas
 * amostras reais e precisam devolver exatamente a mesma coisa.
 */
describe("as duas cópias do vigia não podem divergir", () => {
  const semNome = (f: { chave: string; url: string; tipo: string }) => ({
    chave: f.chave,
    url: f.url,
    tipo: f.tipo,
  });
  const porChave = (a: { chave: string }, b: { chave: string }) =>
    a.chave.localeCompare(b.chave);

  it("a lista de fontes é a mesma, inclusive o tipo", async () => {
    const { FONTES: doScript } = await import("../../scripts/vigia-feed.mjs");
    expect(doScript.map(semNome).sort(porChave)).toEqual(
      FONTES.map(semNome).sort(porChave)
    );
  });

  it.each(["cqcs", "apolice", "sonho-seguro"])(
    "o parse do script devolve o mesmo que lerFeed na amostra de %s",
    async (amostra) => {
      const { readFileSync } = await import("node:fs");
      const { lerItens } = await import("../../scripts/vigia-feed.mjs");
      const { lerFeed } = await import("@/lib/vigia/feed");

      const xml = readFileSync(`tests/vigia/amostras/${amostra}.xml`, "utf8");
      expect(lerItens(xml)).toEqual(lerFeed(xml));
    }
  );
});
