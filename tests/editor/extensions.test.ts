import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { BLOCOS_PROPRIOS } from "@/lib/editor/extensions";
import { cortarRestrito, extrairTexto } from "@/lib/editor/document";

/**
 * Prova que os três blocos próprios existem no esquema do Tiptap e que um
 * documento que os usa sobrevive à ida e volta pelo ProseMirror.
 *
 * É o teste que responde à pergunta mais arriscada do sub-projeto: a API de
 * nó customizado do Tiptap aguenta o que o SegReport precisa?
 */

const schema = getSchema([StarterKit, ...BLOCOS_PROPRIOS]);

describe("esquema do editor", () => {
  it("conhece os três blocos próprios", () => {
    expect(Object.keys(schema.nodes)).toEqual(
      expect.arrayContaining(["indicatorChart", "proBox", "relatedArticles"])
    );
  });

  it("mantém os blocos padrão do editor", () => {
    expect(Object.keys(schema.nodes)).toEqual(
      expect.arrayContaining(["paragraph", "heading", "blockquote", "bulletList"])
    );
  });

  it("proBox aceita blocos dentro — é contêiner, não átomo", () => {
    expect(schema.nodes.proBox.isAtom).toBe(false);
    expect(schema.nodes.indicatorChart.isAtom).toBe(true);
  });
});

describe("ida e volta pelo ProseMirror", () => {
  const original = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Abertura da matéria." }] },
      { type: "indicatorChart", attrs: { indicatorKey: "sinistralidade-auto", months: 24 } },
      {
        type: "proBox",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Análise exclusiva." }] },
        ],
      },
      { type: "relatedArticles", attrs: { slugs: ["uma-materia", "outra"] } },
    ],
  };

  it("o documento sobrevive à validação do esquema sem perder bloco", () => {
    const no = schema.nodeFromJSON(original);
    const volta = no.toJSON();
    expect(volta.content.map((b: { type: string }) => b.type)).toEqual([
      "paragraph",
      "indicatorChart",
      "proBox",
      "relatedArticles",
    ]);
  });

  it("os atributos do gráfico sobrevivem com o tipo certo", () => {
    const volta = schema.nodeFromJSON(original).toJSON();
    const grafico = volta.content.find((b: { type: string }) => b.type === "indicatorChart");
    expect(grafico.attrs.indicatorKey).toBe("sinistralidade-auto");
    expect(grafico.attrs.months).toBe(24);
  });

  it("a lista de relacionadas sobrevive como array", () => {
    const volta = schema.nodeFromJSON(original).toJSON();
    const rel = volta.content.find((b: { type: string }) => b.type === "relatedArticles");
    expect(rel.attrs.slugs).toEqual(["uma-materia", "outra"]);
  });

  it("o texto de dentro do proBox sobrevive", () => {
    const volta = schema.nodeFromJSON(original).toJSON();
    expect(extrairTexto(volta)).toContain("Análise exclusiva.");
  });

  it("o corte do restrito funciona sobre o documento validado", () => {
    const volta = schema.nodeFromJSON(original).toJSON();
    const cortado = JSON.stringify(cortarRestrito(volta));
    expect(cortado).not.toContain("Análise exclusiva.");
    expect(cortado).toContain("Abertura da matéria.");
    // O gráfico e as relacionadas continuam: não são restritos.
    expect(cortado).toContain("sinistralidade-auto");
  });
});
