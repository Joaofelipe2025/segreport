import { describe, expect, it } from "vitest";
import { rotaDaMateria } from "@/lib/redacao/rota";

describe("a tabela de decisão da procedência", () => {
  it("release não credita ninguém", () => {
    // O comunicado veio do próprio interessado e todos os veículos
    // receberam igual. Creditar o primeiro a publicar seria inventar um
    // dono que o fato não tem.
    const r = rotaDaMateria("release", false);
    expect(r.origem).toBe("release");
  });

  it("apuração COM fonte primária é matéria própria", () => {
    const r = rotaDaMateria("apuracao", true);
    expect(r.origem).toBe("primaria");
  });

  it("apuração SEM fonte primária é derivada", () => {
    // É o único caminho que produz texto derivado. O que a derivada implica
    // (crédito e marca de checagem) é travado em `camposDaProcedencia`, o
    // código que a rota de fato executa.
    expect(rotaDaMateria("apuracao", false).origem).toBe("derivada");
  });

  it("só esse caminho é derivado — em nenhum outro", () => {
    const casos: Array<[Parameters<typeof rotaDaMateria>[0], boolean]> = [
      ["release", true],
      ["release", false],
      ["apuracao", true],
    ];
    for (const [classe, achou] of casos) {
      expect(rotaDaMateria(classe, achou).origem, `${classe}/${achou}`).not.toBe("derivada");
    }
  });

  it("a rota não carrega mais a regra do crédito", () => {
    // A regra mora em um lugar só. Um campo de volta aqui seria a segunda cópia.
    expect(Object.keys(rotaDaMateria("apuracao", false)).sort()).toEqual(["origem", "palavras"]);
  });

  it("release é curto, apuração é um pouco maior", () => {
    expect(rotaDaMateria("release", false).palavras).toEqual([180, 300]);
    expect(rotaDaMateria("apuracao", true).palavras).toEqual([300, 450]);
    expect(rotaDaMateria("apuracao", false).palavras).toEqual([300, 450]);
  });
});
