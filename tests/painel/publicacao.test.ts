import { describe, expect, it } from "vitest";
import { pendenciasParaPublicar } from "@/lib/painel/publicacao";
import type { DocumentoBlocos } from "@/lib/editor/document";

const corpoBom = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Tem texto aqui." }] }],
} as DocumentoBlocos;

const completa = {
  title: "Susep muda a regra de capital",
  category_id: 3,
  slug: "susep-muda-a-regra-de-capital",
  corpo: corpoBom,
};

describe("portão de publicação", () => {
  it("matéria completa não tem pendência", () => {
    expect(pendenciasParaPublicar(completa)).toEqual([]);
  });

  it("título curto é pendência", () => {
    expect(pendenciasParaPublicar({ ...completa, title: "Oi" })).toContain(
      "o título precisa de pelo menos três caracteres"
    );
  });

  it("sem categoria é pendência — matéria sem editoria some do portal", () => {
    expect(pendenciasParaPublicar({ ...completa, category_id: null })).toContain(
      "escolha uma categoria"
    );
  });

  it("endereço provisório é pendência", () => {
    // `criarMateria` grava `rascunho-<timestamp>`. Publicar assim põe no ar
    // uma URL que ninguém adivinha e que, depois de indexada, não se corrige
    // sem quebrar link.
    expect(pendenciasParaPublicar({ ...completa, slug: "rascunho-mug0vle1" })).toContain(
      "troque o endereço provisório da matéria"
    );
  });

  it("corpo com só um parágrafo vazio conta como vazio", () => {
    // É exatamente o documento que `criarMateria` grava. Sem isto, toda
    // matéria recém-criada passaria no portão.
    const vazio = { type: "doc", content: [{ type: "paragraph" }] } as DocumentoBlocos;
    expect(pendenciasParaPublicar({ ...completa, corpo: vazio })).toContain(
      "escreva o corpo da matéria"
    );
  });

  it("corpo com só espaços também conta como vazio", () => {
    const branco = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "   " }] }],
    } as DocumentoBlocos;
    expect(pendenciasParaPublicar({ ...completa, corpo: branco })).toContain(
      "escreva o corpo da matéria"
    );
  });

  it("corpo nulo conta como vazio", () => {
    expect(pendenciasParaPublicar({ ...completa, corpo: null })).toContain(
      "escreva o corpo da matéria"
    );
  });

  it("corpo só com um bloco de indicador não é texto", () => {
    // O gráfico não tem texto nenhum: extrairTexto devolve vazio de propósito,
    // porque chave de indicador não é palavra da matéria.
    const soGrafico = {
      type: "doc",
      content: [{ type: "indicatorChart", attrs: { indicatorKey: "premios-saude", months: 12 } }],
    } as DocumentoBlocos;
    expect(pendenciasParaPublicar({ ...completa, corpo: soGrafico })).toContain(
      "escreva o corpo da matéria"
    );
  });

  it("lista TODAS as pendências de uma vez, não uma por vez", () => {
    // Corrigir, salvar, descobrir o próximo erro, repetir — é o que torna um
    // formulário insuportável.
    const p = pendenciasParaPublicar({
      title: "Oi",
      category_id: null,
      slug: "rascunho-abc",
      corpo: null,
    });
    expect(p).toHaveLength(4);
  });
});

describe("endereço vazio", () => {
  it("é pendência de publicação", () => {
    // `slugDeNome` devolve "" para título sem alfanumérico ASCII: "...",
    // "🔥🔥🔥", "Проверка". A coluna é `text not null unique` e aceita ""
    // alegremente — e a matéria vai ao ar em /noticias/, que é a listagem.
    expect(pendenciasParaPublicar({ ...completa, slug: "" })).toContain(
      "a matéria precisa de um endereço"
    );
    expect(pendenciasParaPublicar({ ...completa, slug: "   " })).toContain(
      "a matéria precisa de um endereço"
    );
  });
});
