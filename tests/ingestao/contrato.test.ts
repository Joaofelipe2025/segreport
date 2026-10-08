import { describe, expect, it } from "vitest";
import { CATEGORIAS_ACEITAS, LIMITE_DE_MARKDOWN, camposDaProcedencia, validarPedido } from "@/lib/ingestao/contrato";
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

describe("procedência no contrato de entrada", () => {
  const base = {
    titulo: "Um título que serve",
    categoria: "regulacao",
    corpoMarkdown: "Um parágrafo com texto suficiente para passar.",
  };

  it("pedido sem procedência continua válido — é o caminho manual e o do Astra", () => {
    const r = validarPedido(base);
    expect(r.ok).toBe(true);
    expect(r.ok && r.pedido.origem).toBeNull();
    expect(r.ok && r.pedido.capaUrl).toBeNull();
    expect(r.ok && r.pedido.pautaId).toBeNull();
  });

  it("derivada SEM fonte é recusada aqui, com mensagem legível", () => {
    // Se escapar, quem recusa é a check constraint do Postgres, e o agente
    // recebe um 500 cru em vez de saber o que corrigir.
    const r = validarPedido({ ...base, origem: "derivada" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.comoCorrigir).toMatch(/fonteOriginalUrl/);
  });

  it("derivada COM fonte passa e grava nome e endereço", () => {
    const r = validarPedido({
      ...base,
      origem: "derivada",
      fonteOriginalUrl: "https://cqcs.com.br/n/1",
      fonteOriginalNome: "CQCS",
    });
    expect(r.ok).toBe(true);
    expect(r.ok && r.pedido.fonteOriginalUrl).toBe("https://cqcs.com.br/n/1");
    expect(r.ok && r.pedido.fonteOriginalNome).toBe("CQCS");
  });

  it("origem inventada é recusada e diz quais existem", () => {
    const r = validarPedido({ ...base, origem: "copiada" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.comoCorrigir).toMatch(/release/);
  });

  it("endereço de origem precisa ser http", () => {
    const r = validarPedido({
      ...base,
      origem: "derivada",
      fonteOriginalUrl: "javascript:alert(1)",
    });
    expect(r.ok).toBe(false);
  });

  it("release e primaria não exigem fonte", () => {
    for (const o of ["release", "primaria"]) {
      expect(validarPedido({ ...base, origem: o }).ok, o).toBe(true);
    }
  });

  it("pautaId vem aparado, e vazio vira nulo", () => {
    const r = validarPedido({ ...base, pautaId: "  abc  " });
    expect(r.ok && r.pedido.pautaId).toBe("abc");
    const vazio = validarPedido({ ...base, pautaId: "   " });
    expect(vazio.ok && vazio.pedido.pautaId).toBeNull();
  });

  describe("capaUrl", () => {
    it("aceita só caminho do projeto", () => {
      for (const capa of ["/capas/regulacao.jpg", "/capas/mercado.jpg"]) {
        const r = validarPedido({ ...base, capaUrl: capa });
        expect(r.ok, capa).toBe(true);
        expect(r.ok && r.pedido.capaUrl).toBe(capa);
      }
    });

    it("recusa qualquer esquema: o otimizador só conhece o armazenamento do portal", () => {
      for (const capa of ["https://x.com/a.png", "http://x.com/a.png", "javascript:alert(1)", "data:image/png;base64,AA", "capas/a.png", "//evil.com/a.png"]) {
        const r = validarPedido({ ...base, capaUrl: capa });
        expect(r.ok, capa).toBe(false);
        expect(r.ok === false && r.comoCorrigir).toMatch(/caminho do projeto/);
        expect(r.ok === false && r.comoCorrigir).toMatch(/upload do painel/);
      }
    });

    it("recusa barra invertida e segmento ..", () => {
      for (const capa of ["/\\evil.com/a.png", "/capas\\a.png", "/../x", "/capas/../x", "/%2e%2e/x", "/%2E%2E/x", "/capas/%2e./x", "/%5cevil.com/a.png"]) {
        const r = validarPedido({ ...base, capaUrl: capa });
        expect(r.ok, capa).toBe(false);
        expect(r.ok === false && r.comoCorrigir).toMatch(/capaUrl/);
      }
    });
  });

  describe("campo de tipo errado não é descartado em silêncio", () => {
    it("recusa, dizendo o tipo esperado", () => {
      const casos: Array<[string, unknown]> = [
        ["origem", 1],
        ["fonteOriginalUrl", ["x"]],
        ["fonteOriginalNome", { a: 1 }],
        ["capaUrl", 5],
        ["pautaId", 42],
      ];
      for (const [campo, valor] of casos) {
        const r = validarPedido({ ...base, [campo]: valor });
        expect(r.ok, campo).toBe(false);
        expect(r.ok === false && r.comoCorrigir, campo).toMatch(new RegExp(campo));
        expect(r.ok === false && r.comoCorrigir, campo).toMatch(/texto/);
      }
    });

    it("nulo conta como ausente", () => {
      const r = validarPedido({ ...base, origem: null, capaUrl: null, pautaId: null });
      expect(r.ok).toBe(true);
    });
  });
});

describe("camposDaProcedencia — o que a rota grava", () => {
  const pedidoDe = (extra: Record<string, unknown>) => {
    const r = validarPedido({
      titulo: "Um título que serve",
      categoria: "regulacao",
      corpoMarkdown: "Um parágrafo com texto suficiente para passar.",
      ...extra,
    });
    if (!r.ok) throw new Error(r.erro);
    return r.pedido;
  };

  it("derivada nasce marcada para checagem", () => {
    const c = camposDaProcedencia(
      pedidoDe({ origem: "derivada", fonteOriginalUrl: "https://cqcs.com.br/n/1", fonteOriginalNome: "CQCS", capaUrl: "/capas/mercado.jpg" })
    );
    expect(c).toEqual({
      origem: "derivada",
      fonte_original_url: "https://cqcs.com.br/n/1",
      fonte_original_nome: "CQCS",
      precisa_checagem: true,
      cover_url: "/capas/mercado.jpg",
    });
  });

  it("release e primaria não são marcadas", () => {
    for (const o of ["release", "primaria"]) {
      expect(camposDaProcedencia(pedidoDe({ origem: o })).precisa_checagem, o).toBe(false);
    }
  });

  it("pedido sem procedência grava tudo nulo e sem marca", () => {
    expect(camposDaProcedencia(pedidoDe({}))).toEqual({
      origem: null,
      fonte_original_url: null,
      fonte_original_nome: null,
      precisa_checagem: false,
      cover_url: null,
    });
  });
});
