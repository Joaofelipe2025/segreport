import { describe, expect, it } from "vitest";
import { podeEditarMateria } from "@/lib/painel/permissao";

const MINHA = "autor-1";
const ALHEIA = "autor-2";

describe("direito de editar uma matéria", () => {
  it("o admin edita qualquer matéria, em qualquer estado", () => {
    for (const status of ["draft", "in_review", "scheduled", "published", "archived"]) {
      expect(podeEditarMateria("admin", MINHA, { author_id: ALHEIA, status })).toBe(true);
    }
  });

  it("o colunista edita a própria em rascunho e em revisão", () => {
    expect(podeEditarMateria("columnist", MINHA, { author_id: MINHA, status: "draft" })).toBe(
      true
    );
    expect(
      podeEditarMateria("columnist", MINHA, { author_id: MINHA, status: "in_review" })
    ).toBe(true);
  });

  it("o colunista NÃO edita a própria depois de publicada", () => {
    // Espelha `articles_update_columnist`: sem isto o editor abriria e o
    // Salvar falharia no banco, que é a pior combinação — parece que dá.
    for (const status of ["scheduled", "published", "archived"]) {
      expect(podeEditarMateria("columnist", MINHA, { author_id: MINHA, status })).toBe(false);
    }
  });

  it("o colunista NÃO edita matéria de outro autor", () => {
    expect(podeEditarMateria("columnist", MINHA, { author_id: ALHEIA, status: "draft" })).toBe(
      false
    );
  });

  it("o colunista sem assinatura pública não edita nada", () => {
    // Conta convidada antes de o autor ser criado e vinculado.
    expect(podeEditarMateria("columnist", null, { author_id: MINHA, status: "draft" })).toBe(
      false
    );
  });

  it("matéria sem autor não é editável por colunista nenhum", () => {
    // `author_id` nulo casaria com `authorId` nulo numa comparação ingênua.
    expect(podeEditarMateria("columnist", null, { author_id: null, status: "draft" })).toBe(
      false
    );
  });

  it("o leitor não edita nada", () => {
    expect(podeEditarMateria("reader", MINHA, { author_id: MINHA, status: "draft" })).toBe(
      false
    );
  });
});
