import { describe, expect, it } from "vitest";
import {
  ESTADOS_EDITORIAIS,
  corDeEstado,
  estadoValido,
  rotuloDeEstado,
} from "@/lib/painel/estados";

describe("estados editoriais", () => {
  it("são cinco, na ordem do fluxo editorial", () => {
    expect(ESTADOS_EDITORIAIS).toEqual([
      "draft",
      "in_review",
      "scheduled",
      "published",
      "archived",
    ]);
  });

  it("reconhece um estado válido", () => {
    expect(estadoValido("in_review")).toBe(true);
  });

  it("recusa o que vem da URL e não é estado", () => {
    // O filtro chega por ?estado= e aceita qualquer coisa.
    expect(estadoValido("published; drop table")).toBe(false);
    expect(estadoValido("")).toBe(false);
    expect(estadoValido(undefined)).toBe(false);
    expect(estadoValido(null)).toBe(false);
    expect(estadoValido(42)).toBe(false);
  });

  it("dá rótulo em português a todo estado conhecido", () => {
    expect(ESTADOS_EDITORIAIS.map(rotuloDeEstado)).toEqual([
      "Rascunho",
      "Em revisão",
      "Agendada",
      "Publicada",
      "Arquivada",
    ]);
  });

  it("estado desconhecido devolve o próprio valor, não vazio", () => {
    // Melhor mostrar 'limbo' na tela do que um espaço em branco sem pista.
    expect(rotuloDeEstado("limbo")).toBe("limbo");
    expect(corDeEstado("limbo")).not.toBe("");
  });
});
