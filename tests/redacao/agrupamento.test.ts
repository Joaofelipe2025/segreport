import { describe, expect, it } from "vitest";
import { agrupar, reservaExpirada } from "@/lib/redacao/agrupamento";
import type { PautaBruta } from "@/lib/redacao/pauta";

const p = (over: Partial<PautaBruta>): PautaBruta => ({
  id: Math.random().toString(36).slice(2),
  fonte: "cqcs",
  tipoDeFonte: "imprensa",
  titulo: "Seguradora X anuncia aquisição da Y",
  url: "https://cqcs.com.br/n/" + Math.random().toString(36).slice(2),
  resumo: null,
  publicadoEm: "2026-10-08T10:00:00.000Z",
  estado: "nova",
  criadoEm: "2026-10-08T10:05:00.000Z",
  ...over,
});

describe("agrupar reproduções do mesmo comunicado", () => {
  it("títulos quase iguais em veículos diferentes viram um grupo", () => {
    // Três veículos publicando o mesmo release são UM fato, não três. A URL
    // difere entre eles, então agrupar por URL não resolve nada.
    const g = agrupar([
      p({ fonte: "cqcs", titulo: "Seguradora X anuncia aquisição da Y" }),
      p({ fonte: "apolice", titulo: "Seguradora X anuncia a aquisição da Y" }),
      p({ fonte: "sonho-seguro", titulo: "SEGURADORA X ANUNCIA AQUISIÇÃO DA Y" }),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].pautas).toHaveLength(3);
  });

  it("fatos diferentes continuam separados", () => {
    const g = agrupar([
      p({ titulo: "Susep abre consulta pública sobre resseguro" }),
      p({ titulo: "ANS reajusta planos individuais em 6,9%" }),
    ]);
    expect(g).toHaveLength(2);
  });

  it("a principal do grupo é a mais antiga — quem publicou primeiro", () => {
    const antiga = p({ fonte: "apolice", publicadoEm: "2026-10-08T08:00:00.000Z" });
    const nova = p({ fonte: "cqcs", publicadoEm: "2026-10-08T11:00:00.000Z" });
    const [g] = agrupar([nova, antiga]);
    expect(g.principal.fonte).toBe("apolice");
  });

  it("pauta sem data não derruba a escolha da principal", () => {
    const g = agrupar([p({ publicadoEm: null }), p({ publicadoEm: null })]);
    expect(g[0].principal).toBeDefined();
  });

  it("pauta sem data convive com datada, e a datada vence", () => {
    const sem = p({ fonte: "sem-data", publicadoEm: null });
    const com = p({ fonte: "com-data", publicadoEm: "2026-10-08T09:00:00.000Z" });
    expect(agrupar([sem, com])[0].principal.fonte).toBe("com-data");
    expect(agrupar([com, sem])[0].principal.fonte).toBe("com-data");
  });

  it("mesmas palavras em ordem diferente são fatos diferentes", () => {
    // Agrupar errado perde notícia em silêncio; separar errado só gera duas
    // matérias que o dono vê e descarta.
    expect(
      agrupar([
        p({ titulo: "Seguradora A compra B" }),
        p({ titulo: "Seguradora B compra A" }),
      ])
    ).toHaveLength(2);
    expect(
      agrupar([
        p({ titulo: "Reajuste de 6,9%" }),
        p({ titulo: "Reajuste de 9,6%" }),
      ])
    ).toHaveLength(2);
  });

  it("título que reduz a nada não engole os outros", () => {
    const g = agrupar([
      p({ titulo: "···" }),
      p({ titulo: "の" }),
      p({ titulo: "o a de" }),
    ]);
    expect(g).toHaveLength(3);
  });

  it("lista vazia devolve lista vazia", () => {
    expect(agrupar([])).toEqual([]);
  });
});

describe("a reserva que expira", () => {
  const AGORA = new Date("2026-10-08T12:00:00.000Z");
  const atras = (min: number) =>
    new Date(AGORA.getTime() - min * 60_000).toISOString();

  it("reserva de dez minutos ainda vale", () => {
    expect(reservaExpirada("em_producao", atras(10), AGORA)).toBe(false);
  });

  it("reserva de duas horas expirou — execução morreu no meio", () => {
    // Sem isto, uma execução interrompida prende a pauta para sempre e ela
    // some da fila sem nunca virar matéria.
    expect(reservaExpirada("em_producao", atras(120), AGORA)).toBe(true);
  });

  it("exatamente uma hora ainda não expirou", () => {
    expect(reservaExpirada("em_producao", atras(60), AGORA)).toBe(false);
  });

  it("data ilegível conta como expirada — pauta volta para a fila", () => {
    expect(reservaExpirada("em_producao", "nao-e-data", AGORA)).toBe(true);
  });

  it("estado que não é reserva nunca expira", () => {
    expect(reservaExpirada("nova", atras(500), AGORA)).toBe(false);
    expect(reservaExpirada("virou_materia", atras(500), AGORA)).toBe(false);
  });
});
