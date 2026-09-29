import { describe, expect, it } from "vitest";
import { criarLimitador } from "@/lib/portal/limitador";

describe("limitador de tentativas", () => {
  it("deixa passar dentro da cota", () => {
    const lim = criarLimitador({ cota: 3, janelaMs: 60_000 });
    const agora = 1_000_000;
    expect(lim.permite("1.2.3.4", agora)).toBe(true);
    expect(lim.permite("1.2.3.4", agora)).toBe(true);
    expect(lim.permite("1.2.3.4", agora)).toBe(true);
  });

  it("barra a partir da cota+1", () => {
    const lim = criarLimitador({ cota: 2, janelaMs: 60_000 });
    const agora = 1_000_000;
    lim.permite("1.2.3.4", agora);
    lim.permite("1.2.3.4", agora);
    expect(lim.permite("1.2.3.4", agora)).toBe(false);
  });

  it("cada origem tem cota própria", () => {
    const lim = criarLimitador({ cota: 1, janelaMs: 60_000 });
    const agora = 1_000_000;
    expect(lim.permite("1.1.1.1", agora)).toBe(true);
    expect(lim.permite("2.2.2.2", agora)).toBe(true);
    expect(lim.permite("1.1.1.1", agora)).toBe(false);
  });

  it("a janela desliza — passado o tempo, libera de novo", () => {
    const lim = criarLimitador({ cota: 1, janelaMs: 60_000 });
    expect(lim.permite("1.2.3.4", 1_000_000)).toBe(true);
    expect(lim.permite("1.2.3.4", 1_030_000)).toBe(false);
    expect(lim.permite("1.2.3.4", 1_061_000)).toBe(true);
  });

  it("origem desconhecida não vira uma cota compartilhada por todo mundo", () => {
    // Atrás de proxy sem cabeçalho de IP, todos cairiam na mesma chave e um
    // visitante barraria os outros. Sem origem, não limita.
    const lim = criarLimitador({ cota: 1, janelaMs: 60_000 });
    expect(lim.permite(null, 1_000_000)).toBe(true);
    expect(lim.permite(null, 1_000_001)).toBe(true);
  });

  it("não cresce sem limite na memória", () => {
    // Serverless reaproveita o processo entre requisições. Sem poda, um
    // atacante com muitos IPs faria o mapa crescer até derrubar a instância.
    const lim = criarLimitador({ cota: 5, janelaMs: 1_000, maxChaves: 10 });
    for (let i = 0; i < 50; i += 1) lim.permite(`10.0.0.${i}`, 1_000_000);
    expect(lim.tamanho()).toBeLessThanOrEqual(10);
  });

  it("a poda não deixa um atacante limpar a punição de outra pessoa", () => {
    // Se a poda removesse quem está no limite, bastaria gerar chaves novas
    // para zerar o bloqueio alheio. Ela só remove entradas já vencidas.
    const lim = criarLimitador({ cota: 1, janelaMs: 60_000, maxChaves: 2 });
    lim.permite("vitima", 1_000_000);
    expect(lim.permite("vitima", 1_000_100)).toBe(false);
    for (let i = 0; i < 10; i += 1) lim.permite(`ruido-${i}`, 1_000_200);
    expect(lim.permite("vitima", 1_000_300)).toBe(false);
  });
});
