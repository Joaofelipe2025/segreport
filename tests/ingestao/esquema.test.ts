import { describe, expect, it } from "vitest";
import { contarNos, validarContraEsquema } from "@/lib/ingestao/esquema";
import type { DocumentoBlocos } from "@/lib/editor/document";

const doc = (...blocos: unknown[]) => ({ type: "doc", content: blocos }) as DocumentoBlocos;
const p = (texto: string) => ({
  type: "paragraph",
  content: [{ type: "text", text: texto }],
});

describe("validação contra o esquema real do editor", () => {
  it("aceita um documento que o editor sabe abrir", () => {
    expect(validarContraEsquema(doc(p("Corpo da matéria.")))).toBeNull();
  });

  it("aceita os três blocos próprios do SegReport", () => {
    const d = doc(
      p("Abertura."),
      { type: "indicatorChart", attrs: { indicatorKey: "premios-saude", months: 12 } },
      { type: "proBox", content: [p("Análise paga.")] },
      { type: "relatedArticles", attrs: { slugs: ["uma-materia"] } }
    );
    expect(validarContraEsquema(d)).toBeNull();
  });

  it("RECUSA nó de imagem — o renderizador entende, o editor não", () => {
    // Este é o defeito que motivou a validação: o Tiptap, diante de nó
    // desconhecido, ESVAZIA o documento inteiro com um console.warn. Abrir a
    // matéria no editor deixaria a tela em branco, e a primeira tecla
    // gravaria o vazio por cima do texto.
    const erro = validarContraEsquema(
      doc(p("Antes."), { type: "image", attrs: { src: "https://x.com/a.png", alt: "a" } })
    );
    expect(erro).not.toBeNull();
  });

  it("RECUSA item de lista sem parágrafo dentro", () => {
    // Estrutura que passa no parse e só explode na primeira transação do
    // editor: `listItem` exige `paragraph block*`.
    const erro = validarContraEsquema(
      doc({
        type: "bulletList",
        content: [{ type: "listItem", content: [{ type: "text", text: "solto" }] }],
      })
    );
    expect(erro).not.toBeNull();
  });

  it("RECUSA nó inventado", () => {
    expect(validarContraEsquema(doc({ type: "tabelaQueNaoExiste" }))).not.toBeNull();
  });

  it("RECUSA documento vazio de conteúdo — `doc` exige `block+`", () => {
    expect(validarContraEsquema(doc())).not.toBeNull();
  });

  it("a mensagem de erro é aproveitável por quem enviou", () => {
    const erro = validarContraEsquema(doc({ type: "image", attrs: { src: "x" } }));
    expect(erro).toMatch(/image/i);
  });

  it("entrada que nem é documento não derruba a validação", () => {
    expect(validarContraEsquema(null as unknown as DocumentoBlocos)).not.toBeNull();
    expect(validarContraEsquema({ type: "paragraph" } as unknown as DocumentoBlocos)).not.toBeNull();
  });
});

describe("contagem de nós", () => {
  it("conta o documento inteiro, em profundidade", () => {
    // doc + paragraph + text + paragraph + text = 5
    expect(contarNos(doc(p("um"), p("dois")))).toBe(5);
  });

  it("conta dentro de blocos aninhados", () => {
    expect(contarNos(doc({ type: "proBox", content: [p("dentro")] }))).toBe(4);
  });

  it("documento mínimo conta 1", () => {
    expect(contarNos({ type: "doc" } as DocumentoBlocos)).toBe(1);
  });
});
