import { describe, expect, it } from "vitest";
import { creditoDaFonte } from "@/lib/portal/credito";

describe("o crédito ao veículo de origem", () => {
  it("sem fonte, não há crédito", () => {
    expect(creditoDaFonte({})).toBeNull();
  });

  it("com nome e endereço, usa o nome", () => {
    expect(
      creditoDaFonte({ fonteUrl: "https://cqcs.com.br/n/1", fonteNome: "CQCS" })
    ).toBe("CQCS");
  });

  it("sem nome, usa o domínio — nunca o endereço inteiro", () => {
    // Despejar a URL completa no rodapé é feio e vaza parâmetros de
    // rastreio que vieram no feed.
    expect(creditoDaFonte({ fonteUrl: "https://www.cqcs.com.br/n/1?utm=x" })).toBe(
      "cqcs.com.br"
    );
  });

  it("endereço ilegível não derruba a página", () => {
    expect(creditoDaFonte({ fonteUrl: "nem-url" })).toBeNull();
  });
});
