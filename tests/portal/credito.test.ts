import { describe, expect, it } from "vitest";
import { creditoDaFonte, enderecoDeCredito } from "@/lib/portal/credito";

describe("enderecoDeCredito — a única noção de endereço", () => {
  it.each([
    ["https://cqcs.com.br/n/1"],
    ["http://exemplo.com"],
    ["https://www.cqcs.com.br/n/1?utm=x"],
  ])("%j serve", (u) => expect(enderecoDeCredito(u)).toBe(true));

  it.each([
    ["https://"],
    ["http://"],
    ["https://?a=1"],
    ["https://localhost/x"],
    ["https://a.com/b c"],
    ["javascript:alert(1)"],
    ["ftp://x.test/a"],
    ["nem-url"],
    [""],
  ])("%j não serve", (u) => expect(enderecoDeCredito(u)).toBe(false));
});

describe("o crédito ao veículo de origem", () => {
  it("sem fonte, não há crédito", () => {
    expect(creditoDaFonte({})).toBeNull();
  });

  it("com nome e endereço, usa o nome como rótulo", () => {
    expect(
      creditoDaFonte({ fonteUrl: "https://cqcs.com.br/n/1", fonteNome: "CQCS" })
    ).toEqual({ href: "https://cqcs.com.br/n/1", rotulo: "CQCS" });
  });

  it("sem nome, o rótulo é o domínio — nunca o endereço inteiro", () => {
    // Despejar a URL completa no rodapé é feio e vaza parâmetros de
    // rastreio que vieram no feed.
    expect(
      creditoDaFonte({ fonteUrl: "https://www.cqcs.com.br/n/1?utm=x" })
    ).toEqual({ href: "https://www.cqcs.com.br/n/1?utm=x", rotulo: "cqcs.com.br" });
  });

  it("nome só com espaços cai no domínio", () => {
    expect(
      creditoDaFonte({ fonteUrl: "http://exemplo.com/a", fonteNome: "   " })
    ).toEqual({ href: "http://exemplo.com/a", rotulo: "exemplo.com" });
  });

  it("credencial embutida não vira link de phishing com o nome do veículo", () => {
    // https://cqcs.com.br@evil.com tem hostname evil.com. Com nome "CQCS" a
    // página diria "Com informações de CQCS" apontando para evil.com.
    const c = creditoDaFonte({ fonteUrl: "https://cqcs.com.br@evil.com/n", fonteNome: "CQCS" });
    expect(c?.href).toBe("https://evil.com/n");
    expect(c?.href).not.toContain("@");
    // O nome é de terceiro, como o endereço: com credencial no meio, o
    // rótulo é o domínio de verdade, não o nome que se faz passar por outro.
    expect(c?.rotulo).toBe("evil.com");
  });

  it("usuário e senha saem do endereço", () => {
    const c = creditoDaFonte({ fonteUrl: "https://u:p@cqcs.com.br/n/1" });
    expect(c).toEqual({ href: "https://cqcs.com.br/n/1", rotulo: "cqcs.com.br" });
  });

  it("endereço ilegível não derruba a página", () => {
    expect(creditoDaFonte({ fonteUrl: "nem-url" })).toBeNull();
  });

  it.each([
    ["javascript:alert(1)"],
    ["data:text/html,x"],
    ["ftp://x.test/a"],
    ["mailto:a@b.com"],
    [""],
    ["   "],
  ])("endereço %j não gera crédito, mesmo com nome", (fonteUrl) => {
    expect(creditoDaFonte({ fonteUrl, fonteNome: "CQCS" })).toBeNull();
  });
});
