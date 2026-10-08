import { describe, expect, it } from "vitest";
import { rotaDaMateria } from "@/lib/redacao/rota";

describe("a tabela de decisão da procedência", () => {
  it("release não credita ninguém", () => {
    // O comunicado veio do próprio interessado e todos os veículos
    // receberam igual. Creditar o primeiro a publicar seria inventar um
    // dono que o fato não tem.
    const r = rotaDaMateria("release", false);
    expect(r.origem).toBe("release");
    expect(r.precisaCredito).toBe(false);
    expect(r.precisaChecagem).toBe(false);
  });

  it("apuração COM fonte primária é matéria própria", () => {
    const r = rotaDaMateria("apuracao", true);
    expect(r.origem).toBe("primaria");
    expect(r.precisaCredito).toBe(false);
    expect(r.precisaChecagem).toBe(false);
  });

  it("apuração SEM fonte primária credita e nasce marcada", () => {
    // É o único caminho que produz texto derivado. Os dois sinais andam
    // juntos de propósito: um protege quem apurou, o outro protege o leitor.
    const r = rotaDaMateria("apuracao", false);
    expect(r.origem).toBe("derivada");
    expect(r.precisaCredito).toBe(true);
    expect(r.precisaChecagem).toBe(true);
  });

  it("só derivada exige crédito — em nenhum outro caminho", () => {
    const casos: Array<[Parameters<typeof rotaDaMateria>[0], boolean]> = [
      ["release", true],
      ["release", false],
      ["apuracao", true],
    ];
    for (const [classe, achou] of casos) {
      expect(rotaDaMateria(classe, achou).precisaCredito, `${classe}/${achou}`).toBe(false);
    }
  });

  it("crédito e marca de checagem são sempre a mesma resposta", () => {
    // Se um dia divergirem, uma matéria derivada pode sair creditada mas
    // sem marca — publicável sem ninguém conferir. Este teste trava isso.
    for (const classe of ["release", "apuracao"] as const) {
      for (const achou of [true, false]) {
        const r = rotaDaMateria(classe, achou);
        expect(r.precisaCredito, `${classe}/${achou}`).toBe(r.precisaChecagem);
      }
    }
  });

  it("release é curto, apuração é um pouco maior", () => {
    expect(rotaDaMateria("release", false).palavras).toEqual([180, 300]);
    expect(rotaDaMateria("apuracao", true).palavras).toEqual([300, 450]);
    expect(rotaDaMateria("apuracao", false).palavras).toEqual([300, 450]);
  });
});
