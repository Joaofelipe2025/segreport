import { describe, expect, it } from "vitest";
import { confirmacaoConfere } from "@/lib/painel/confirmacao";

describe("confirmação de exclusão pelo título", () => {
  it("confere quando é igual", () => {
    expect(confirmacaoConfere("Susep muda regra", "Susep muda regra")).toBe(true);
  });

  it("aceita espaços em volta — quem copia da tela traz espaço", () => {
    expect(confirmacaoConfere("  Susep muda regra  ", "Susep muda regra")).toBe(true);
  });

  it("aceita diferença de caixa", () => {
    expect(confirmacaoConfere("susep MUDA regra", "Susep muda regra")).toBe(true);
  });

  it("NÃO aceita título parcial", () => {
    expect(confirmacaoConfere("Susep", "Susep muda regra")).toBe(false);
  });

  it("NÃO aceita vazio, nem quando o título é vazio", () => {
    // Título em branco não pode virar 'é só apertar Enter e some'.
    expect(confirmacaoConfere("", "Susep muda regra")).toBe(false);
    expect(confirmacaoConfere("", "")).toBe(false);
    expect(confirmacaoConfere("   ", "   ")).toBe(false);
  });
});
