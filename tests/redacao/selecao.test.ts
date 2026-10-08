import { describe, expect, it } from "vitest";
import { selecionar, TETO_POR_EXECUCAO } from "@/lib/redacao/selecao";
import { capaDaEditoria } from "@/lib/redacao/capa";
import { CATEGORIES } from "@/lib/categories";
import type { Grupo } from "@/lib/redacao/agrupamento";
import type { PautaBruta } from "@/lib/redacao/pauta";

const pauta = (over: Partial<PautaBruta> = {}): PautaBruta => ({
  id: Math.random().toString(36).slice(2),
  fonte: "cqcs",
  tipoDeFonte: "imprensa",
  titulo: "Um título qualquer " + Math.random(),
  url: "https://cqcs.com.br/n/" + Math.random().toString(36).slice(2),
  resumo: "Um resumo.",
  publicadoEm: "2026-10-08T10:00:00.000Z",
  estado: "nova",
  criadoEm: "2026-10-08T10:00:00.000Z",
  atualizadoEm: "2026-10-08T10:00:00.000Z",
  ...over,
});

const grupo = (n: number, over: Partial<PautaBruta> = {}): Grupo => {
  // Veículos distintos por padrão: repercussão é quantos veículos cobriram.
  const ps = Array.from({ length: n }, (_, i) => pauta({ fonte: `veiculo-${i}`, ...over }));
  return { pautas: ps, principal: ps[0] };
};

const grupoDe = (fontes: string[]): Grupo => {
  const ps = fontes.map((fonte) => pauta({ fonte }));
  return { pautas: ps, principal: ps[0] };
};

describe("a seleção do que vira matéria", () => {
  it("nunca passa do teto", () => {
    const g = Array.from({ length: 40 }, () => grupo(1));
    expect(selecionar(g)).toHaveLength(TETO_POR_EXECUCAO);
  });

  it("o teto é dez", () => {
    // Teto no código, não no prompt. Fila de revisão que acumula deixa de
    // ser lida.
    expect(TETO_POR_EXECUCAO).toBe(10);
  });

  it("menos grupos que o teto devolve todos", () => {
    expect(selecionar([grupo(1), grupo(1)])).toHaveLength(2);
  });

  it("grupo com mais veículos vem antes — repercussão é sinal", () => {
    const muito = grupo(3);
    const pouco = grupo(1);
    const [primeiro] = selecionar([pouco, muito]);
    expect(primeiro.pautas).toHaveLength(3);
  });

  it("conta veículos, não pautas: um veículo com três peças perde para dois veículos", () => {
    // `agrupar` não distingue fonte. Um veículo só publicando três peças de
    // título quase igual não é repercussão; um release replicado por dois é.
    const umVeiculoTresPecas = grupoDe(["cqcs", "cqcs", "cqcs"]);
    const doisVeiculos = grupoDe(["cqcs", "apolice"]);
    const [primeiro] = selecionar([umVeiculoTresPecas, doisVeiculos]);
    expect(primeiro).toBe(doisVeiculos);
  });

  it("empate desempata pela mais recente", () => {
    const velho = grupo(1, { publicadoEm: "2026-10-01T10:00:00.000Z" });
    const novo = grupo(1, { publicadoEm: "2026-10-08T10:00:00.000Z" });
    const [primeiro] = selecionar([velho, novo]);
    expect(primeiro.principal.publicadoEm).toBe("2026-10-08T10:00:00.000Z");
  });

  it("lista vazia devolve lista vazia", () => {
    expect(selecionar([])).toEqual([]);
  });
});

describe("a capa por editoria", () => {
  it("editoria conhecida devolve um caminho do projeto", () => {
    const c = capaDaEditoria("regulacao");
    expect(c).toMatch(/^\/capas\//);
  });

  it("editoria sem conjunto devolve nulo, não lança", () => {
    // Sem conjunto, a matéria fica sem cover_url e o portal usa a imagem
    // gerada. Nenhuma matéria quebra por falta de foto.
    expect(capaDaEditoria("editoria-que-nao-existe")).toBeNull();
  });

  it("a escolha é estável para a mesma editoria", () => {
    expect(capaDaEditoria("mercado")).toBe(capaDaEditoria("mercado"));
  });

  it("nenhuma editoria do portal fica sem capa", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    for (const c of CATEGORIES) {
      expect(capaDaEditoria(c.slug), c.slug).not.toBeNull();
    }
  });

  it("nomes herdados de objeto não viram capa", () => {
    // A razão de usar Map: busca literal em objeto responderia a estes.
    for (const nome of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(capaDaEditoria(nome), nome).toBeNull();
    }
  });
});
