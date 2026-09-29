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
