import { describe, expect, it } from "vitest";
import {
  agendadasAtrasadas,
  contarPorEstado,
  porEditoria,
  problemasDaPublicada,
  publicadasDesde,
  rascunhosParados,
  rascunhosVazios,
  type LinhaDoPanorama,
} from "@/lib/painel/panorama";

const AGORA = new Date("2026-09-25T12:00:00Z");

const linha = (p: Partial<LinhaDoPanorama> = {}): LinhaDoPanorama => ({
  id: "1",
  title: "Uma matéria",
  slug: "uma-materia",
  status: "draft",
  updated_at: "2026-09-25T11:00:00Z",
  published_at: null,
  scheduled_for: null,
  category_id: 3,
  cover_url: "/capa.webp",
  excerpt: "Resumo da matéria.",
  reading_time: 4,
  view_count: 0,
  authors: { name: "Da Redação" },
  ...p,
});

describe("agendadas que já passaram da hora", () => {
  it("acusa quem devia ter publicado e não publicou", () => {
    // Não há pg_cron neste projeto: matéria agendada fica agendada para
    // sempre. O painel precisa gritar isso, ou o texto morre na fila.
    const atrasada = linha({ status: "scheduled", scheduled_for: "2026-09-25T09:00:00Z" });
    expect(agendadasAtrasadas([atrasada], AGORA)).toHaveLength(1);
  });

  it("não acusa agendamento ainda no futuro", () => {
    const futura = linha({ status: "scheduled", scheduled_for: "2026-09-26T09:00:00Z" });
    expect(agendadasAtrasadas([futura], AGORA)).toHaveLength(0);
  });

  it("ignora quem não está agendada", () => {
    const publicada = linha({ status: "published", scheduled_for: "2026-09-25T09:00:00Z" });
    expect(agendadasAtrasadas([publicada], AGORA)).toHaveLength(0);
  });

  it("agendada sem data não quebra a conta", () => {
    expect(agendadasAtrasadas([linha({ status: "scheduled", scheduled_for: null })], AGORA)).toEqual(
      []
    );
  });
});

describe("rascunhos parados", () => {
  it("acusa rascunho sem toque há mais de uma semana", () => {
    const parado = linha({ status: "draft", updated_at: "2026-09-10T12:00:00Z" });
    expect(rascunhosParados([parado], AGORA)).toHaveLength(1);
  });

  it("não acusa rascunho mexido ontem", () => {
    const recente = linha({ status: "draft", updated_at: "2026-09-24T12:00:00Z" });
    expect(rascunhosParados([recente], AGORA)).toHaveLength(0);
  });

  it("em revisão não conta como parado — tem fila própria", () => {
    const antigo = linha({ status: "in_review", updated_at: "2026-08-01T12:00:00Z" });
    expect(rascunhosParados([antigo], AGORA)).toHaveLength(0);
  });

  it("o mais antigo vem primeiro", () => {
    const a = linha({ id: "a", status: "draft", updated_at: "2026-09-01T12:00:00Z" });
    const b = linha({ id: "b", status: "draft", updated_at: "2026-08-01T12:00:00Z" });
    expect(rascunhosParados([a, b], AGORA).map((l) => l.id)).toEqual(["b", "a"]);
  });
});

describe("rascunhos vazios", () => {
  it("acusa rascunho que nunca foi salvo", () => {
    // `reading_time` só é gravado no salvamento. Nulo significa que a linha
    // nasceu e ninguém escreveu nada — restos do fluxo antigo, em que o botão
    // gravava antes de existir texto.
    const vazio = linha({ status: "draft", reading_time: null });
    expect(rascunhosVazios([vazio])).toHaveLength(1);
  });

  it("não acusa rascunho com texto", () => {
    expect(rascunhosVazios([linha({ status: "draft", reading_time: 2 })])).toHaveLength(0);
  });

  it("não acusa matéria publicada, mesmo sem tempo de leitura", () => {
    // Publicada sem tempo de leitura é outro problema, e tem bloco próprio.
    // Oferecer exclusão em massa de matéria no ar seria um acidente à espera.
    expect(rascunhosVazios([linha({ status: "published", reading_time: null })])).toHaveLength(0);
  });
});

describe("publicadas no período", () => {
  it("conta o que saiu nos últimos sete dias", () => {
    const linhas = [
      linha({ status: "published", published_at: "2026-09-24T12:00:00Z" }),
      linha({ status: "published", published_at: "2026-09-20T12:00:00Z" }),
      linha({ status: "published", published_at: "2026-09-01T12:00:00Z" }),
    ];
    expect(publicadasDesde(linhas, AGORA, 7)).toBe(2);
  });

  it("publicada sem data não entra na conta", () => {
    expect(publicadasDesde([linha({ status: "published", published_at: null })], AGORA, 7)).toBe(0);
  });

  it("data no futuro não conta como já publicada", () => {
    expect(
      publicadasDesde([linha({ status: "published", published_at: "2026-09-30T12:00:00Z" })], AGORA, 7)
    ).toBe(0);
  });
});

describe("problemas de matéria publicada", () => {
  it("matéria completa não tem problema", () => {
    expect(problemasDaPublicada(linha({ status: "published" }))).toEqual([]);
  });

  it("acusa endereço provisório no ar", () => {
    expect(problemasDaPublicada(linha({ status: "published", slug: "rascunho-abc" }))).toContain(
      "endereço provisório"
    );
  });

  it("acusa falta de categoria, capa e resumo", () => {
    const p = problemasDaPublicada(
      linha({ status: "published", category_id: null, cover_url: null, excerpt: null })
    );
    expect(p).toEqual(expect.arrayContaining(["sem editoria", "sem capa", "sem resumo"]));
  });

  it("resumo só com espaços conta como ausente", () => {
    expect(problemasDaPublicada(linha({ status: "published", excerpt: "   " }))).toContain(
      "sem resumo"
    );
  });

  it("rascunho não é cobrado — ainda está sendo feito", () => {
    expect(
      problemasDaPublicada(linha({ status: "draft", category_id: null, cover_url: null }))
    ).toEqual([]);
  });
});

describe("cobertura por editoria", () => {
  const categorias = [
    { id: 1, label: "Regulação" },
    { id: 2, label: "Auto" },
    { id: 3, label: "Saúde" },
  ];

  it("conta as publicadas de cada editoria", () => {
    const linhas = [
      linha({ status: "published", category_id: 1 }),
      linha({ status: "published", category_id: 1 }),
      linha({ status: "published", category_id: 2 }),
      linha({ status: "draft", category_id: 3 }),
    ];
    const r = porEditoria(linhas, categorias);
    expect(r.find((c) => c.label === "Regulação")?.total).toBe(2);
    expect(r.find((c) => c.label === "Auto")?.total).toBe(1);
  });

  it("editoria sem matéria aparece com zero — o buraco é a informação", () => {
    // Uma editoria que sumiu da lista some também da atenção de quem edita.
    const r = porEditoria([linha({ status: "published", category_id: 1 })], categorias);
    expect(r.find((c) => c.label === "Saúde")?.total).toBe(0);
    expect(r).toHaveLength(3);
  });

  it("ordena da mais coberta para a menos coberta", () => {
    const linhas = [
      linha({ status: "published", category_id: 2 }),
      linha({ status: "published", category_id: 2 }),
      linha({ status: "published", category_id: 1 }),
    ];
    expect(porEditoria(linhas, categorias).map((c) => c.label)).toEqual([
      "Auto",
      "Regulação",
      "Saúde",
    ]);
  });

  it("matéria sem editoria não some da conta geral, mas não inventa categoria", () => {
    const r = porEditoria([linha({ status: "published", category_id: null })], categorias);
    expect(r.every((c) => c.total === 0)).toBe(true);
  });
});

describe("contagem por estado", () => {
  it("conta cada estado e zera os ausentes", () => {
    const c = contarPorEstado([
      linha({ status: "draft" }),
      linha({ status: "draft" }),
      linha({ status: "published" }),
    ]);
    expect(c.draft).toBe(2);
    expect(c.published).toBe(1);
    expect(c.archived).toBe(0);
  });

  it("estado desconhecido não entra na conta", () => {
    expect(contarPorEstado([linha({ status: "limbo" })]).draft).toBe(0);
  });
});
