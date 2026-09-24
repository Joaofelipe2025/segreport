import { describe, expect, it } from "vitest";
import {
  cortarRestrito,
  extrairTexto,
  tempoDeLeitura,
  MARCADOR_RESTRITO,
  type DocumentoBlocos,
} from "@/lib/editor/document";

const doc = (...blocos: unknown[]): DocumentoBlocos =>
  ({ type: "doc", content: blocos }) as DocumentoBlocos;

const paragrafo = (texto: string) => ({
  type: "paragraph",
  content: [{ type: "text", text: texto }],
});

const titulo = (texto: string, level = 2) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text: texto }],
});

describe("extração de texto para busca", () => {
  it("junta o texto dos parágrafos", () => {
    const d = doc(paragrafo("Primeiro."), paragrafo("Segundo."));
    expect(extrairTexto(d)).toBe("Primeiro.\n\nSegundo.");
  });

  it("inclui subtítulos e citações", () => {
    const d = doc(
      titulo("O limite do dado"),
      paragrafo("Corpo."),
      { type: "blockquote", content: [paragrafo("Citação.")] }
    );
    expect(extrairTexto(d)).toContain("O limite do dado");
    expect(extrairTexto(d)).toContain("Citação.");
  });

  it("inclui a legenda da imagem, que é texto editorial", () => {
    const d = doc({
      type: "image",
      attrs: { src: "/x.webp", alt: "Fachada da SUSEP", legenda: "Sede em Brasília" },
    });
    expect(extrairTexto(d)).toContain("Sede em Brasília");
  });

  it("NÃO inclui atributos técnicos — chave de indicador não é texto", () => {
    const d = doc(
      paragrafo("Antes."),
      { type: "indicatorChart", attrs: { indicatorKey: "premios-saude", months: 12 } },
      paragrafo("Depois.")
    );
    const texto = extrairTexto(d);
    expect(texto).toContain("Antes.");
    expect(texto).toContain("Depois.");
    expect(texto).not.toContain("premios-saude");
  });

  it("inclui o texto de dentro do bloco restrito", () => {
    // A busca é interna: o admin precisa achar a matéria pelo que ela diz,
    // mesmo na parte paga. Quem corta para o leitor é cortarRestrito.
    const d = doc(paragrafo("Aberto."), {
      type: "proBox",
      content: [paragrafo("Análise paga.")],
    });
    expect(extrairTexto(d)).toContain("Análise paga.");
  });

  it("documento vazio devolve string vazia, não quebra", () => {
    expect(extrairTexto(doc())).toBe("");
    expect(extrairTexto({ type: "doc" } as DocumentoBlocos)).toBe("");
  });

  it("bloco de tipo desconhecido é ignorado sem derrubar", () => {
    const d = doc(paragrafo("Antes."), { type: "blocoDoFuturo", attrs: { x: 1 } }, paragrafo("Depois."));
    expect(extrairTexto(d)).toBe("Antes.\n\nDepois.");
  });
});

describe("corte do trecho restrito", () => {
  it("substitui o conteúdo do proBox por um marcador", () => {
    const d = doc(paragrafo("Abertura livre."), {
      type: "proBox",
      content: [paragrafo("Texto pago.")],
    });
    const cortado = cortarRestrito(d);
    const json = JSON.stringify(cortado);

    expect(json).not.toContain("Texto pago.");
    expect(json).toContain(MARCADOR_RESTRITO);
    expect(json).toContain("Abertura livre.");
  });

  it("preserva o documento quando não há bloco restrito", () => {
    const d = doc(paragrafo("Tudo aberto."));
    expect(cortarRestrito(d)).toEqual(d);
  });

  it("corta blocos restritos aninhados em qualquer profundidade", () => {
    const d = doc({
      type: "blockquote",
      content: [{ type: "proBox", content: [paragrafo("Escondido fundo.")] }],
    });
    expect(JSON.stringify(cortarRestrito(d))).not.toContain("Escondido fundo.");
  });

  it("corta todos os blocos restritos, não só o primeiro", () => {
    const d = doc(
      { type: "proBox", content: [paragrafo("Primeiro pago.")] },
      paragrafo("Meio aberto."),
      { type: "proBox", content: [paragrafo("Segundo pago.")] }
    );
    const json = JSON.stringify(cortarRestrito(d));
    expect(json).not.toContain("Primeiro pago.");
    expect(json).not.toContain("Segundo pago.");
    expect(json).toContain("Meio aberto.");
  });

  it("não modifica o documento original", () => {
    const d = doc({ type: "proBox", content: [paragrafo("Pago.")] });
    const antes = JSON.stringify(d);
    cortarRestrito(d);
    expect(JSON.stringify(d)).toBe(antes);
  });
});

describe("tempo de leitura", () => {
  it("arredonda para cima, com mínimo de um minuto", () => {
    expect(tempoDeLeitura(doc(paragrafo("Três palavras aqui")))).toBe(1);
  });

  it("usa 200 palavras por minuto", () => {
    const texto = Array.from({ length: 450 }, () => "palavra").join(" ");
    expect(tempoDeLeitura(doc(paragrafo(texto)))).toBe(3);
  });

  it("documento vazio ainda devolve um minuto", () => {
    expect(tempoDeLeitura(doc())).toBe(1);
  });
});
