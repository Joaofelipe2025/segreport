import { describe, expect, it } from "vitest";
import { FalhaDeConsulta, exigir, haConflito } from "@/lib/painel/consulta";

describe("exigir", () => {
  it("devolve o dado quando não houve erro", () => {
    expect(exigir({ data: [1, 2], error: null }, "as matérias")).toEqual([1, 2]);
  });

  it("levanta FalhaDeConsulta quando o Supabase devolve erro", () => {
    expect(() =>
      exigir({ data: null, error: { message: "permission denied" } }, "as matérias")
    ).toThrow(FalhaDeConsulta);
  });

  it("a mensagem diz o que falhou, em português, e guarda o detalhe técnico", () => {
    // Foi exatamente isto que faltou no editor: o 42501 existia e ninguém viu.
    try {
      exigir({ data: null, error: { message: "42501: permission denied" } }, "as matérias");
      throw new Error("deveria ter levantado");
    } catch (e) {
      const f = e as FalhaDeConsulta;
      expect(f.message).toContain("as matérias");
      expect(f.detalhe).toBe("42501: permission denied");
    }
  });

  it("dado nulo SEM erro passa — ausência legítima não é falha", () => {
    // `maybeSingle()` de linha inexistente devolve data nulo e error nulo.
    expect(exigir({ data: null, error: null }, "a matéria")).toBeNull();
  });
});

describe("decisão de conflito de edição", () => {
  it("recusa quando o carimbo do servidor mudou", () => {
    expect(haConflito("2026-09-24T10:00:00Z", "2026-09-24T11:00:00Z", null)).toBe(true);
  });

  it("deixa passar quando o carimbo é o mesmo", () => {
    expect(haConflito("2026-09-24T10:00:00Z", "2026-09-24T10:00:00Z", null)).toBe(false);
  });

  it("deixa passar quando o cliente não mandou carimbo", () => {
    // Formulário antigo ou primeira gravação: não há o que comparar.
    expect(haConflito("", "2026-09-24T10:00:00Z", null)).toBe(false);
  });

  it("RECUSA quando a leitura do carimbo falhou — falha fechada", () => {
    // Antes, erro na leitura deixava `atual` nulo, o `if` não entrava e a
    // gravação seguia: a proteção contra edição simultânea se desligava
    // sozinha no exato caso em que deveria proteger.
    expect(haConflito("2026-09-24T10:00:00Z", null, { message: "timeout" })).toBe(true);
  });

  it("RECUSA quando a matéria sumiu do servidor", () => {
    expect(haConflito("2026-09-24T10:00:00Z", null, null)).toBe(true);
  });
});
