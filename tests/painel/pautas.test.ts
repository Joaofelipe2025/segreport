import { describe, expect, it } from "vitest";
import { pautasVisiveis, resumoDaExecucao } from "@/lib/painel/pautas";

const AGORA = new Date("2026-09-29T12:00:00Z");
const dias = (n: number) =>
  new Date(AGORA.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe("o que aparece na lista por padrão", () => {
  it("mostra pauta nova e recente", () => {
    const r = pautasVisiveis([{ estado: "nova", criado_em: dias(1) }], AGORA);
    expect(r).toHaveLength(1);
  });

  it("esconde pauta nova com mais de sete dias", () => {
    // Radar que acumula ruído deixa de ser lido.
    const r = pautasVisiveis([{ estado: "nova", criado_em: dias(8) }], AGORA);
    expect(r).toHaveLength(0);
  });

  it("esconde pauta já lida ou descartada, mesmo recente", () => {
    const r = pautasVisiveis(
      [
        { estado: "lida", criado_em: dias(1) },
        { estado: "descartada", criado_em: dias(1) },
        { estado: "virou_materia", criado_em: dias(1) },
      ],
      AGORA
    );
    expect(r).toHaveLength(0);
  });

  it("exatamente sete dias ainda aparece", () => {
    expect(pautasVisiveis([{ estado: "nova", criado_em: dias(7) }], AGORA)).toHaveLength(1);
  });
});

describe("o aviso sobre a última execução", () => {
  it("execução recente com achados é calma", () => {
    const r = resumoDaExecucao(
      { comecou_em: dias(0), achados: { cqcs: 3 }, falhas: {} },
      AGORA
    );
    expect(r.tom).toBe("calmo");
  });

  it("execução com falha em alguma fonte pede atenção", () => {
    const r = resumoDaExecucao(
      { comecou_em: dias(0), achados: { cqcs: 3 }, falhas: { apolice: "HTTP 503" } },
      AGORA
    );
    expect(r.tom).toBe("atencao");
    expect(r.texto).toContain("apolice");
  });

  it("diferencia execução de 20 minutos da de 23 horas — não é texto idêntico", () => {
    // A FR-2.2 pede "quando foi a última execução". Sem isto, duas execuções
    // calmas em horários bem diferentes produzem o mesmo texto.
    const vinteMinutos = new Date(AGORA.getTime() - 20 * 60 * 1000).toISOString();
    const vinteETresHoras = new Date(AGORA.getTime() - 23 * 60 * 60 * 1000).toISOString();
    const a = resumoDaExecucao({ comecou_em: vinteMinutos, achados: { cqcs: 3 }, falhas: {} }, AGORA);
    const b = resumoDaExecucao(
      { comecou_em: vinteETresHoras, achados: { cqcs: 3 }, falhas: {} },
      AGORA
    );
    expect(a.texto).not.toBe(b.texto);
    expect(a.texto).toMatch(/min/);
    expect(b.texto).toMatch(/\d+h/);
  });

  it("o alerta de falha por fonte também diz quando foi a execução", () => {
    const vinteMinutos = new Date(AGORA.getTime() - 20 * 60 * 1000).toISOString();
    const r = resumoDaExecucao(
      { comecou_em: vinteMinutos, achados: { cqcs: 3 }, falhas: { apolice: "HTTP 503" } },
      AGORA
    );
    expect(r.texto).toMatch(/min/);
  });

  it("o aviso de silêncio total também diz quando foi a execução", () => {
    const vinteMinutos = new Date(AGORA.getTime() - 20 * 60 * 1000).toISOString();
    const r = resumoDaExecucao(
      { comecou_em: vinteMinutos, achados: { cqcs: 0 }, falhas: {} },
      AGORA
    );
    expect(r.texto).toMatch(/min/);
  });

  it("nenhum achado em NENHUMA fonte é suspeito, não calmo", () => {
    // Pode ser dia calmo; também é como parecem três feeds que mudaram de
    // formato ao mesmo tempo, depois de uma atualização do WordPress.
    const r = resumoDaExecucao(
      { comecou_em: dias(0), achados: { cqcs: 0, apolice: 0 }, falhas: {} },
      AGORA
    );
    expect(r.tom).toBe("atencao");
  });

  it("vigia parado há mais de um dia é alerta", () => {
    const r = resumoDaExecucao(
      { comecou_em: dias(2), achados: { cqcs: 5 }, falhas: {} },
      AGORA
    );
    expect(r.tom).toBe("alerta");
    expect(r.texto).toMatch(/n[ãa]o roda/i);
  });

  it("nunca rodou é alerta, e diz isso", () => {
    const r = resumoDaExecucao(null, AGORA);
    expect(r.tom).toBe("alerta");
    expect(r.texto).toMatch(/nunca/i);
  });
});
