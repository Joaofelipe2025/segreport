import { describe, expect, it } from "vitest";
import { mensagemDeMotivo } from "@/lib/painel/motivos";

describe("motivos de recusa na porta da redação", () => {
  it("sessão expirada", () => {
    expect(mensagemDeMotivo("sessao")).toBe("Sua sessão expirou. Entre de novo.");
  });

  it("sem acesso ao painel — sem sugerir que a conta não existe", () => {
    expect(mensagemDeMotivo("permissao")).toBe(
      "Esta porta é da redação. Sua conta não tem acesso ao painel."
    );
  });

  it("link vencido e link ilegível são mensagens diferentes", () => {
    expect(mensagemDeMotivo("link-expirado")).toBe("O link venceu. Peça outro abaixo.");
    expect(mensagemDeMotivo("link-invalido")).toBe(
      "O link não pôde ser lido. Peça outro abaixo."
    );
  });

  it("sem motivo devolve nulo — a tela não mostra aviso nenhum", () => {
    expect(mensagemDeMotivo(undefined)).toBeNull();
    expect(mensagemDeMotivo(null)).toBeNull();
    expect(mensagemDeMotivo("")).toBeNull();
  });

  it("motivo desconhecido devolve nulo, não o código cru", () => {
    // A URL é pública e aceita qualquer coisa. Ecoar o valor na tela seria
    // deixar um estranho escrever no nosso aviso.
    expect(mensagemDeMotivo("<script>alert(1)</script>")).toBeNull();
    expect(mensagemDeMotivo("qualquer-coisa")).toBeNull();
    expect(mensagemDeMotivo(42)).toBeNull();
    expect(mensagemDeMotivo(["sessao"])).toBeNull();
  });

  it("não herda propriedade de Object.prototype", () => {
    // Busca em objeto literal responde a 'constructor' e 'toString' com o
    // que veio do protótipo — viraria função no lugar de aviso.
    expect(mensagemDeMotivo("constructor")).toBeNull();
    expect(mensagemDeMotivo("toString")).toBeNull();
    expect(mensagemDeMotivo("__proto__")).toBeNull();
  });
});
