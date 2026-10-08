import { describe, expect, it } from "vitest";
import { procedenciaParaExibir } from "@/lib/painel/procedencia";

describe("a procedência mostrada a quem confirma a checagem", () => {
  it("derivada mostra a origem e o endereço como link", () => {
    expect(
      procedenciaParaExibir({
        origem: "derivada",
        fonte_original_url: "https://cqcs.com.br/n/1",
        fonte_original_nome: "CQCS",
      })
    ).toEqual({
      origem: "Cobertura de terceiro",
      endereco: "https://cqcs.com.br/n/1",
      href: "https://cqcs.com.br/n/1",
      veiculo: "CQCS",
    });
  });

  it("endereço que não serve de crédito aparece como texto, nunca como link", () => {
    // O link clicável vem de dado de terceiro: javascript: não pode virar <a>.
    const p = procedenciaParaExibir({
      origem: "derivada",
      fonte_original_url: "javascript:alert(1)",
      fonte_original_nome: null,
    });
    expect(p?.href).toBeNull();
    expect(p?.endereco).toBe("javascript:alert(1)");
  });

  it("matéria sem origem nem endereço não tem procedência a mostrar", () => {
    expect(
      procedenciaParaExibir({ origem: null, fonte_original_url: null, fonte_original_nome: null })
    ).toBeNull();
  });

  it("origem desconhecida aparece como veio", () => {
    expect(
      procedenciaParaExibir({ origem: "xyz", fonte_original_url: null, fonte_original_nome: null })
        ?.origem
    ).toBe("xyz");
  });
});
