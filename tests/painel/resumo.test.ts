import { describe, expect, it } from "vitest";
import { nomeDoAutor } from "@/lib/painel/resumo";

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
