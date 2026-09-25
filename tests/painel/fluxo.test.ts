import { describe, expect, it } from "vitest";
import {
  ESTADOS_DO_FLUXO,
  enderecoAPartirDoTitulo,
  enderecoParaGravar,
  enderecoEstaCongelado,
  transicoesDe,
} from "@/lib/painel/fluxo";

describe("os três estados do fluxo", () => {
  it("são rascunho, revisão e publicada, nessa ordem", () => {
    expect(ESTADOS_DO_FLUXO).toEqual(["draft", "in_review", "published"]);
  });

  it("agendada e arquivada ficam de fora", () => {
    // Agendar nunca funcionou: sem pg_cron, nada publica sozinho. Um botão
    // que não faz o que promete é pior do que a ausência dele.
    expect(ESTADOS_DO_FLUXO).not.toContain("scheduled");
    expect(ESTADOS_DO_FLUXO).not.toContain("archived");
  });
});

describe("transições oferecidas", () => {
  it("o colunista manda o próprio rascunho para revisão, e nada mais", () => {
    expect(transicoesDe("draft", "columnist")).toEqual([
      { para: "in_review", rotulo: "Enviar para revisão", tom: "primario" },
    ]);
  });

  it("o colunista não publica nem despublica", () => {
    const paras = transicoesDe("in_review", "columnist").map((t) => t.para);
    expect(paras).not.toContain("published");
    expect(transicoesDe("published", "columnist")).toEqual([]);
  });

  it("o admin publica direto do rascunho, sem passar pela revisão", () => {
    // Redação pequena: obrigar o admin a mandar para si mesmo e devolver é
    // cerimônia sem ganho. A revisão existe para o texto de outra pessoa.
    const paras = transicoesDe("draft", "admin").map((t) => t.para);
    expect(paras).toContain("published");
    expect(paras).toContain("in_review");
  });

  it("o admin devolve ou publica o que está em revisão", () => {
    expect(transicoesDe("in_review", "admin").map((t) => t.para)).toEqual([
      "draft",
      "published",
    ]);
  });

  it("despublicar devolve para rascunho, não para um quarto estado", () => {
    expect(transicoesDe("published", "admin")).toEqual([
      { para: "draft", rotulo: "Despublicar", tom: "discreto" },
    ]);
  });

  it("estado legado ainda oferece saída para o admin, em vez de prender a matéria", () => {
    // Não há como criar 'archived' nem 'scheduled' pela interface nova, mas
    // linhas antigas existem. Sem saída, elas ficariam presas para sempre.
    expect(transicoesDe("archived", "admin").map((t) => t.para)).toContain("draft");
    expect(transicoesDe("scheduled", "admin").map((t) => t.para)).toContain("draft");
  });

  it("o leitor não recebe transição nenhuma", () => {
    expect(transicoesDe("draft", "reader")).toEqual([]);
  });
});

describe("endereço a partir do título", () => {
  it("acompanha o título enquanto a matéria não foi publicada", () => {
    expect(enderecoAPartirDoTitulo("Susep muda a regra de capital", "", "draft")).toBe(
      "susep-muda-a-regra-de-capital"
    );
  });

  it("recalcula quando o título muda", () => {
    expect(
      enderecoAPartirDoTitulo("Susep adia a regra", "susep-muda-a-regra", "draft")
    ).toBe("susep-adia-a-regra");
  });

  it("CONGELA depois de publicada — link no ar não se mexe", () => {
    // Trocar o endereço de matéria publicada transforma em 404 todo link
    // compartilhado, indexado ou citado. O título pode ser corrigido; o
    // endereço, não.
    expect(
      enderecoAPartirDoTitulo("Susep adia a regra", "susep-muda-a-regra", "published")
    ).toBe("susep-muda-a-regra");
  });

  it("título sem letra latina não produz endereço vazio", () => {
    const r = enderecoAPartirDoTitulo("🔥🔥🔥", "", "draft");
    expect(r).not.toBe("");
    expect(r).toMatch(/^[a-z0-9-]+$/);
  });

  it("título em branco mantém o endereço que havia", () => {
    expect(enderecoAPartirDoTitulo("", "ja-existia", "draft")).toBe("ja-existia");
  });
});

describe("congelamento do endereço", () => {
  it("congela em publicada", () => {
    expect(enderecoEstaCongelado("published")).toBe(true);
  });

  it("não congela em rascunho nem em revisão", () => {
    expect(enderecoEstaCongelado("draft")).toBe(false);
    expect(enderecoEstaCongelado("in_review")).toBe(false);
  });

  it("estado legado que já esteve no ar continua congelado", () => {
    expect(enderecoEstaCongelado("archived")).toBe(true);
  });
});

describe("o que gravar na coluna slug", () => {
  it("grava o endereço derivado do título enquanto é rascunho", () => {
    expect(enderecoParaGravar("Susep adia a regra", "susep-adia-a-regra", "draft")).toBe(
      "susep-adia-a-regra"
    );
  });

  it("normaliza o que o cliente mandou — o formulário é editável", () => {
    expect(enderecoParaGravar("Qualquer", "Susep ADIA a Regra!", "draft")).toBe(
      "susep-adia-a-regra"
    );
  });

  it("cai para o título quando o cliente manda vazio", () => {
    expect(enderecoParaGravar("Susep adia a regra", "", "draft")).toBe("susep-adia-a-regra");
  });

  it("devolve undefined em matéria publicada — a coluna fica intocada", () => {
    // `undefined` no update do Supabase significa "não mexa nesta coluna". É
    // o congelamento, decidido no servidor e não na confiança do cliente:
    // um POST direto com outro slug não move o link que está no ar.
    expect(enderecoParaGravar("Título novo", "endereco-novo", "published")).toBeUndefined();
  });

  it("devolve undefined quando não há nada utilizável — não grava vazio", () => {
    // Gravar "" poria a matéria em /noticias/, que é a própria listagem.
    expect(enderecoParaGravar("", "", "draft")).toBeUndefined();
    expect(enderecoParaGravar("🔥", "🔥", "draft")).toBeUndefined();
  });
});
