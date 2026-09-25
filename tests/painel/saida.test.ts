import { describe, expect, it } from "vitest";
import { AVISO_DE_SAIDA, deveAvisarAoSair } from "@/lib/painel/saida";
import { slugDeAssinatura } from "@/lib/painel/assinatura";
import { enderecoDisponivel } from "@/lib/painel/endereco";

describe("aviso ao sair com trabalho não salvo", () => {
  it("avisa quando há alteração pendente e o destino é outra página", () => {
    expect(deveAvisarAoSair(true, "/admin/materias/abc", "/admin/materias")).toBe(true);
  });

  it("não avisa quando não há alteração", () => {
    expect(deveAvisarAoSair(false, "/admin/materias/abc", "/admin/materias")).toBe(false);
  });

  it("não avisa quando o destino é a própria página", () => {
    // Clicar no item de menu da página em que já se está não é sair.
    expect(deveAvisarAoSair(true, "/admin/materias/abc", "/admin/materias/abc")).toBe(false);
  });

  it("não avisa quando o destino só difere na query", () => {
    // Trocar filtro na mesma tela não descarta o editor.
    expect(deveAvisarAoSair(true, "/admin/materias", "/admin/materias?estado=draft")).toBe(
      false
    );
  });

  it("o texto do aviso diz o que se perde, não apenas 'tem certeza?'", () => {
    expect(AVISO_DE_SAIDA).toContain("não salvo");
  });
});

describe("endereço público da assinatura", () => {
  it("aceita um slug já em forma canônica", () => {
    expect(slugDeAssinatura("ana-paula-costa", "Ana Paula Costa")).toBe("ana-paula-costa");
  });

  it("normaliza o que a pessoa digitou", () => {
    expect(slugDeAssinatura("  Ana Paula COSTA ", "Ana Paula Costa")).toBe("ana-paula-costa");
  });

  it("campo vazio cai para o nome — é o padrão de quem nunca mexeu", () => {
    expect(slugDeAssinatura("", "João Félix")).toBe("joao-felix");
    expect(slugDeAssinatura("   ", "João Félix")).toBe("joao-felix");
  });

  it("NÃO devolve vazio quando nome e slug não têm letra latina", () => {
    // slugDeNome só preserva [a-z0-9]. Um nome fora do alfabeto latino
    // produzia slug vazio, e authors.slug não tem check de não-vazio: a
    // página /colunistas/ quebrava.
    expect(slugDeAssinatura("", "日本語の名前")).toBeNull();
    expect(slugDeAssinatura("—— ——", "···")).toBeNull();
  });
});

describe("endereço único na criação", () => {
  it("o primeiro fica com o endereço limpo", () => {
    expect(enderecoDisponivel("Boletim do dia", [])).toBe("boletim-do-dia");
  });

  it("o segundo ganha sufixo em vez de ser recusado", () => {
    // Coluna diária repete título por natureza. Recusar a criação joga o
    // problema no colo do colunista, que nem pode mudar o endereço — o campo
    // é desabilitado para ele, e o gatilho do banco barra a troca.
    const r = enderecoDisponivel("Boletim do dia", ["boletim-do-dia"]);
    expect(r).toMatch(/^boletim-do-dia-/);
    expect(r).not.toBe("boletim-do-dia");
  });

  it("pula todos os ocupados", () => {
    const ocupados = ["boletim-do-dia", "boletim-do-dia-2"];
    expect(ocupados).not.toContain(enderecoDisponivel("Boletim do dia", ocupados));
  });

  it("título sem letra latina ainda produz endereço utilizável", () => {
    const r = enderecoDisponivel("🔥🔥🔥", []);
    expect(r.length).toBeGreaterThan(0);
    expect(r).toMatch(/^[a-z0-9-]+$/);
  });
});
