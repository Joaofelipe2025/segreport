import { describe, expect, it } from "vitest";
import { converterMarkdown, LIMITE_DE_NOS } from "@/lib/ingestao/markdown";

const tipos = (md: string) => {
  const r = converterMarkdown(md);
  if (!r.ok) throw new Error(`esperava sucesso, veio: ${r.erro}`);
  return r.doc.content?.map((n) => n.type) ?? [];
};

describe("o que o Astra escreve e vira matéria", () => {
  it("parágrafos", () => {
    expect(tipos("Primeiro.\n\nSegundo.")).toEqual(["paragraph", "paragraph"]);
  });

  it("subtítulos", () => {
    expect(tipos("## Sub\n\nCorpo.")).toEqual(["heading", "paragraph"]);
  });

  it("título sublinhado com --- é SUBTÍTULO, não linha horizontal", () => {
    // É o caso que mais derruba parser artesanal: em CommonMark `Texto\n---`
    // é H2. Usar o parser oficial do Tiptap é o que garante isto.
    expect(tipos("Titulo\n---\n\nCorpo.")).toEqual(["heading", "paragraph"]);
  });

  it("listas, citação e código", () => {
    expect(tipos("- um\n- dois")).toEqual(["bulletList"]);
    expect(tipos("1. um\n2. dois")).toEqual(["orderedList"]);
    expect(tipos("> citado")).toEqual(["blockquote"]);
    expect(tipos("```js\nconst a = 1;\n```")).toEqual(["codeBlock"]);
  });

  it("negrito, itálico e link sobrevivem", () => {
    const r = converterMarkdown("Texto **forte** e [link](https://susep.gov.br).");
    expect(r.ok).toBe(true);
    const json = JSON.stringify(r.ok && r.doc);
    expect(json).toContain("bold");
    expect(json).toContain("https://susep.gov.br");
  });
});

describe("o que é recusado, e por quê", () => {
  it("imagem — o editor não conhece o nó", () => {
    // O renderizador desenha `image`, o StarterKit não tem. Deixar passar
    // esvaziaria a matéria ao abrir no editor.
    const r = converterMarkdown("![foto](https://x.com/a.png)");
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.comoCorrigir).toMatch(/capa/i);
  });

  it("tabela — o editor não tem esse bloco", () => {
    const r = converterMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(r.ok).toBe(false);
  });

  it("markdown vazio", () => {
    expect(converterMarkdown("").ok).toBe(false);
    expect(converterMarkdown("   \n  ").ok).toBe(false);
  });

  it("link que não é https", () => {
    // O React neutraliza `javascript:` na renderização, mas o link ficaria
    // gravado e visível. E link para domínio sósia, publicado sob a marca do
    // veículo, é risco editorial antes de ser técnico.
    for (const md of [
      "[x](javascript:alert(1))",
      "[x](http://inseguro.test)",
      "[x](data:text/html,<script>)",
    ]) {
      const r = converterMarkdown(md);
      expect(r.ok, md).toBe(false);
      expect(r.ok === false && r.comoCorrigir, md).toMatch(/https/i);
    }
  });

  it("link relativo para dentro do próprio portal passa", () => {
    expect(converterMarkdown("[outra](/noticias/uma-materia)").ok).toBe(true);
  });

  it("documento com nós demais", () => {
    const enorme = Array.from({ length: LIMITE_DE_NOS }, (_, i) => `P${i}.`).join("\n\n");
    const r = converterMarkdown(enorme);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.comoCorrigir).toMatch(/long|tamanho|curt/i);
  });
});

describe("o resultado é sempre abrível pelo editor", () => {
  it("todo sucesso passa na validação de esquema", () => {
    const entradas = [
      "Um parágrafo.",
      "## Sub\n\nCorpo com **forte**.",
      "- um\n  - aninhado\n- dois",
      "> citado\n>\n> continua",
      "Titulo\n---\n\nCorpo.",
      "1. um\n2. dois\n3. tres",
    ];
    for (const md of entradas) {
      const r = converterMarkdown(md);
      expect(r.ok, md).toBe(true);
    }
  });
});
