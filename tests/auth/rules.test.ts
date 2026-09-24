import { describe, expect, it } from "vitest";
import {
  destinoAposLogin,
  emailValido,
  itensDeMenu,
  podeAcessarPainel,
  slugDeNome,
} from "@/lib/auth/rules";

describe("validação de e-mail", () => {
  it("aceita endereço comum", () => {
    expect(emailValido("helena@corretora.com.br")).toBe(true);
  });

  it("recusa sem arroba, sem domínio, ou com espaço", () => {
    expect(emailValido("helena")).toBe(false);
    expect(emailValido("helena@")).toBe(false);
    expect(emailValido("helena@corretora")).toBe(false);
    expect(emailValido("he lena@corretora.com")).toBe(false);
    expect(emailValido("")).toBe(false);
  });
});

describe("destino depois do login", () => {
  it("quem edita vai para o painel", () => {
    expect(destinoAposLogin("admin")).toBe("/admin");
    expect(destinoAposLogin("columnist")).toBe("/admin");
  });

  it("leitor vai para o Hub, não para o painel", () => {
    expect(destinoAposLogin("reader")).toBe("/hub");
  });

  it("papel desconhecido cai no Hub — nunca no painel", () => {
    // Falha fechada: um papel que o código não reconhece não pode virar
    // acesso administrativo por omissão.
    expect(destinoAposLogin(null)).toBe("/hub");
    expect(destinoAposLogin("qualquer-coisa" as never)).toBe("/hub");
  });
});

describe("acesso ao painel", () => {
  it("admin e colunista entram; leitor não", () => {
    expect(podeAcessarPainel("admin")).toBe(true);
    expect(podeAcessarPainel("columnist")).toBe(true);
    expect(podeAcessarPainel("reader")).toBe(false);
  });
});

describe("menu por papel", () => {
  it("admin vê todas as seções", () => {
    const rotas = itensDeMenu("admin").map((i) => i.href);
    expect(rotas).toEqual([
      "/admin/materias",
      "/admin/colunistas",
      "/admin/midia",
      "/admin/ajustes",
    ]);
  });

  it("colunista vê apenas matérias e mídia", () => {
    const rotas = itensDeMenu("columnist").map((i) => i.href);
    expect(rotas).toEqual(["/admin/materias", "/admin/midia"]);
  });

  it("leitor não vê seção nenhuma", () => {
    expect(itensDeMenu("reader")).toEqual([]);
  });
});

describe("slug a partir do nome", () => {
  it("remove acentos e normaliza separadores", () => {
    expect(slugDeNome("Helena Braga")).toBe("helena-braga");
    expect(slugDeNome("João Félix de Assunção")).toBe("joao-felix-de-assuncao");
    expect(slugDeNome("  Redação   SegReport  ")).toBe("redacao-segreport");
  });

  it("não deixa hífen sobrando nas pontas", () => {
    expect(slugDeNome("— Ana —")).toBe("ana");
  });
});
