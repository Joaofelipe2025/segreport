import { describe, expect, it } from "vitest";
import { CATEGORIAS_ACEITAS, LIMITE_DE_MARKDOWN, validarPedido } from "@/lib/ingestao/contrato";
import { CATEGORIES } from "@/lib/categories";
import { chaveDeConteudo } from "@/lib/ingestao/contrato";

const bom = {
  titulo: "Susep adia a regra de capital",
  categoria: "regulacao",
  corpoMarkdown: "A autarquia recuou depois da consulta pública.",
};

describe("contrato de entrada", () => {
  it("aceita o mínimo: título, categoria e corpo", () => {
    const r = validarPedido(bom);
    expect(r.ok).toBe(true);
  });

  it("aceita os campos opcionais", () => {
    const r = validarPedido({
      ...bom,
      linhaDeApoio: "O que muda para as seguradoras.",
      resumo: "Resumo para a listagem.",
      seoTitulo: "Susep adia regra",
      seoDescricao: "Descrição para busca.",
    });
    expect(r.ok).toBe(true);
    expect(r.ok && r.pedido.linhaDeApoio).toBe("O que muda para as seguradoras.");
  });

  it("recusa título curto, com instrução", () => {
    const r = validarPedido({ ...bom, titulo: "Oi" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.comoCorrigir).toMatch(/t[íi]tulo/i);
  });

  it("recusa corpo ausente", () => {
    const r = validarPedido({ titulo: bom.titulo, categoria: "regulacao" });
    expect(r.ok).toBe(false);
  });

  it("recusa categoria inválida DIZENDO quais existem", () => {
    // Quem lê a resposta é um modelo. "categoria inválida" o faz reenviar
    // igual; a lista o faz se corrigir sozinho.
    const r = validarPedido({ ...bom, categoria: "economia" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.comoCorrigir).toContain("regulacao");
  });

  it("recusa corpo gigante antes de tentar interpretar", () => {
    const r = validarPedido({ ...bom, corpoMarkdown: "a".repeat(LIMITE_DE_MARKDOWN + 1) });
    expect(r.ok).toBe(false);
  });

  it("recusa entrada que nem é objeto", () => {
    for (const lixo of [null, "texto", 42, []]) {
      expect(validarPedido(lixo).ok, String(lixo)).toBe(false);
    }
  });

  it("ignora campo desconhecido em vez de quebrar", () => {
    // O Astra pode inventar um campo; isso não é motivo para recusar a
    // matéria inteira.
    expect(validarPedido({ ...bom, inventado: "x" }).ok).toBe(true);
  });

  it("apara espaços — modelo adora deixar quebra de linha no título", () => {
    const r = validarPedido({ ...bom, titulo: "  Susep adia a regra  \n" });
    expect(r.ok && r.pedido.titulo).toBe("Susep adia a regra");
  });

  it("campo opcional vazio vira nulo, não string vazia", () => {
    const r = validarPedido({ ...bom, resumo: "   " });
    expect(r.ok && r.pedido.resumo).toBeNull();
  });
});

describe("as categorias aceitas são as do portal", () => {
  it("não existe uma quinta fonte de verdade", () => {
    // Banco, categories.ts, contrato, prompt do Astra e esquema OpenAPI
    // precisam concordar. Este teste amarra o contrato ao módulo do portal.
    expect([...CATEGORIAS_ACEITAS].sort()).toEqual(CATEGORIES.map((c) => c.slug).sort());
  });
});

describe("chave de deduplicação", () => {
  it("o mesmo conteúdo dá a mesma chave", () => {
    expect(chaveDeConteudo("Título", "Corpo")).toBe(chaveDeConteudo("Título", "Corpo"));
  });

  it("corpo diferente dá chave diferente — reenvio corrigido NÃO é duplicata", () => {
    // Se a correção do Astra fosse tratada como duplicata, ele receberia
    // sucesso e o texto antigo continuaria no ar. É o pior modo de falha
    // possível num produto de notícia.
    expect(chaveDeConteudo("Título", "Corpo")).not.toBe(chaveDeConteudo("Título", "Corpo v2"));
  });

  it("título diferente dá chave diferente", () => {
    expect(chaveDeConteudo("A", "Corpo")).not.toBe(chaveDeConteudo("B", "Corpo"));
  });

  it("espaço em volta não muda a chave", () => {
    expect(chaveDeConteudo(" Título ", "Corpo\n")).toBe(chaveDeConteudo("Título", "Corpo"));
  });

  it("é um sha256 em hexadecimal", () => {
    expect(chaveDeConteudo("x", "y")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("o esquema que o Astra recebe não pode divergir do portal", () => {
  it("o enum de categorias na documentação é exatamente o do código", async () => {
    // Banco, categories.ts, contrato, prompt e esquema OpenAPI precisam
    // concordar. Sem este teste, o arquivo que o usuário cola no GPT vira a
    // quinta fonte de verdade — e a primeira a divergir em silêncio, porque
    // ninguém relê documentação.
    const { readFileSync } = await import("node:fs");
    const doc = readFileSync("docs/integracao/astra.md", "utf8");

    // `\r?\n` e não `\n`: o git entrega este repositório em CRLF no Windows,
    // então um padrão preso a LF passa na máquina de quem escreveu e falha em
    // todas as outras. Consertar o arquivo não resolveria — o git converte de
    // volta no próximo checkout. Quem tem de tolerar é o teste.
    const bloco = doc.match(/enum:\r?\n((?:\s+- [a-z]+\r?\n)+)/);
    expect(bloco, "não achei o enum no arquivo de integração").not.toBeNull();

    const noDoc = bloco![1]
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*-\s*/, "").trim())
      .filter(Boolean);

    expect(noDoc.sort()).toEqual([...CATEGORIAS_ACEITAS].sort());
  });
});
