import { describe, expect, it } from "vitest";
import { FalhaDeConsulta, exigir } from "@/lib/painel/consulta";

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
