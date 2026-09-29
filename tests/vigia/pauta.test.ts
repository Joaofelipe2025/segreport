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
    expect(r.ok && r.recusados).toEqual([]);
  });

  it("aceita lista vazia — dia calmo é resultado válido", () => {
    const r = validarAchados([]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toEqual([]);
    expect(r.ok && r.recusados).toEqual([]);
  });

  it("recusa fonte desconhecida SEM derrubar o lote, e conta como desconhecida", () => {
    // Um item ruim não pode fazer os outros 79 sumirem, e não pode sumir
    // ele mesmo: vira recusa de item, não recusa de lote.
    const r = validarAchados([{ ...bom, fonte: "blog-do-vizinho" }]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toEqual([]);
    expect(r.ok && r.recusados).toHaveLength(1);
    expect(r.ok && r.recusados[0].fonte).toBe("desconhecida");
  });

  it("RECUSA tipo que não bate com o cadastro da fonte, mas sem derrubar o lote", () => {
    // Esta é a CON-1 em código: um adaptador de imprensa não pode se
    // declarar fonte primária e, nas etapas seguintes, alcançar o gerador
    // de matéria. A diferença desta revisão é que a recusa some do LOTE,
    // não do RASTRO: o item não é gravado, mas aparece nos recusados.
    const r = validarAchados([{ ...bom, tipoDeFonte: "primaria" }]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toEqual([]);
    expect(r.ok && r.recusados).toHaveLength(1);
    expect(r.ok && r.recusados[0].fonte).toBe("cqcs");
    expect(r.ok && r.recusados[0].motivo).toMatch(/imprensa/i);
  });

  it("a recusa por tipo diz o que resolve, não manda omitir o campo", () => {
    // Omitir tipoDeFonte cai na MESMA comparação (undefined !== cadastro.tipo)
    // e leva à mesma recusa. Quem seguisse o conselho antigo ("não declare o
    // tipo") continuaria sendo recusado.
    const r = validarAchados([{ ...bom, tipoDeFonte: "primaria" }]);
    const motivo = (r.ok && r.recusados[0].motivo) || "";
    expect(motivo).not.toMatch(/não declare/i);
    expect(motivo).toMatch(/declare.*imprensa|corrija o cadastro/i);
  });

  it("recusa url que não é http, item a item, sem derrubar o lote", () => {
    for (const url of ["javascript:alert(1)", "ftp://x.test/a", "/relativo", ""]) {
      const r = validarAchados([{ ...bom, url }]);
      expect(r.ok, url).toBe(true);
      expect(r.ok && r.achados, url).toEqual([]);
      expect(r.ok && r.recusados, url).toHaveLength(1);
    }
  });

  it("recusa título vazio, item a item, sem derrubar o lote", () => {
    const r = validarAchados([{ ...bom, titulo: "   " }]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toEqual([]);
    expect(r.ok && r.recusados).toHaveLength(1);
  });

  it("lote com itens bons e um ruim: devolve os bons e conta o ruim", () => {
    const bom2 = { ...bom, url: "https://cqcs.com.br/noticia/y/" };
    const ruim = { ...bom, fonte: "blog-do-vizinho", url: "https://blog.test/a" };
    const r = validarAchados([bom, bom2, ruim]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toHaveLength(2);
    expect(r.ok && r.recusados).toHaveLength(1);
    expect(r.ok && r.recusados[0].fonte).toBe("desconhecida");
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
