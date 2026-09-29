import { describe, expect, it } from "vitest";
import { validarAchados } from "@/lib/vigia/pauta";

const bom = {
  fonte: "cqcs",
  tipoDeFonte: "imprensa",
  titulo: "Susep publica circular sobre capital",
  url: "https://cqcs.com.br/noticia/x/",
  resumo: "O regulador atualizou os requisitos.",
  publicadoEm: "2026-09-29T17:19:20.000Z",
};

describe("validação dos achados", () => {
  it("aceita uma lista boa", () => {
    const r = validarAchados([bom]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toHaveLength(1);
  });

  it("aceita lista vazia — dia calmo é resultado válido", () => {
    const r = validarAchados([]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toEqual([]);
  });

  it("recusa fonte desconhecida", () => {
    const r = validarAchados([{ ...bom, fonte: "blog-do-vizinho" }]);
    expect(r.ok).toBe(false);
  });

  it("RECUSA tipo que não bate com o cadastro da fonte", () => {
    // Esta é a CON-1 em código: um adaptador de imprensa não pode se
    // declarar fonte primária e, nas etapas seguintes, alcançar o gerador
    // de matéria.
    const r = validarAchados([{ ...bom, tipoDeFonte: "primaria" }]);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.erro).toMatch(/imprensa/i);
  });

  it("recusa url que não é http", () => {
    for (const url of ["javascript:alert(1)", "ftp://x.test/a", "/relativo", ""]) {
      expect(validarAchados([{ ...bom, url }]).ok, url).toBe(false);
    }
  });

  it("recusa título vazio", () => {
    expect(validarAchados([{ ...bom, titulo: "   " }]).ok).toBe(false);
  });

  it("apara e normaliza", () => {
    const r = validarAchados([{ ...bom, titulo: "  Com espaço  " }]);
    expect(r.ok && r.achados[0].titulo).toBe("Com espaço");
  });

  it("resumo em branco vira nulo", () => {
    const r = validarAchados([{ ...bom, resumo: "   " }]);
    expect(r.ok && r.achados[0].resumo).toBeNull();
  });

  it("data ilegível vira nula em vez de derrubar a lista", () => {
    const r = validarAchados([{ ...bom, publicadoEm: "ontem" }]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados[0].publicadoEm).toBeNull();
  });

  it("recusa o que nem é lista", () => {
    for (const lixo of [null, "texto", 42, {}]) {
      expect(validarAchados(lixo).ok, String(lixo)).toBe(false);
    }
  });

  it("recusa lista grande demais", () => {
    const muitos = Array.from({ length: 501 }, (_, i) => ({
      ...bom,
      url: `https://cqcs.com.br/n/${i}`,
    }));
    expect(validarAchados(muitos).ok).toBe(false);
  });
});
