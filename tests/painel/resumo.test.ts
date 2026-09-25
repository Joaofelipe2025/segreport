import { describe, expect, it } from "vitest";
import { contarPorEstado, nomeDoAutor } from "@/lib/painel/resumo";

describe("contagem por estado", () => {
  it("conta cada estado", () => {
    const c = contarPorEstado([
      { status: "draft" },
      { status: "draft" },
      { status: "in_review" },
      { status: "published" },
    ]);
    expect(c.draft).toBe(2);
    expect(c.in_review).toBe(1);
    expect(c.published).toBe(1);
  });

  it("estado sem nenhuma matéria vale zero, não indefinido", () => {
    // A tela soma e formata; indefinido viraria 'NaN' no painel.
    const c = contarPorEstado([]);
    expect(c.draft).toBe(0);
    expect(c.in_review).toBe(0);
    expect(c.scheduled).toBe(0);
    expect(c.published).toBe(0);
    expect(c.archived).toBe(0);
  });

  it("ignora estado que não é editorial em vez de quebrar", () => {
    const c = contarPorEstado([{ status: "limbo" }, { status: "draft" }]);
    expect(c.draft).toBe(1);
    expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe("nome do autor", () => {
  it("devolve o nome quando existe", () => {
    expect(nomeDoAutor({ authors: { name: "Da Redação" } })).toBe("Da Redação");
  });

  it("autor ausente não quebra a listagem", () => {
    // `authors(name)` volta nulo quando o autor foi apagado ou o vínculo
    // sumiu. A tela precisa continuar de pé.
    expect(nomeDoAutor({ authors: null })).toBe("Sem assinatura");
  });

  it("autor sem nome também", () => {
    expect(nomeDoAutor({ authors: { name: null } })).toBe("Sem assinatura");
  });

  it("nome só com espaços conta como ausente", () => {
    expect(nomeDoAutor({ authors: { name: "   " } })).toBe("Sem assinatura");
  });
});
