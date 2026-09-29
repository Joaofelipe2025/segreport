import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { lerFeed } from "@/lib/vigia/feed";

const amostra = (nome: string) =>
  readFileSync(`tests/vigia/amostras/${nome}.xml`, "utf8");

const FEEDS = ["cqcs", "apolice", "sonho-seguro"] as const;

describe("leitura de feed real", () => {
  it("acha itens nos três feeds", () => {
    for (const f of FEEDS) {
      expect(lerFeed(amostra(f)).length, f).toBeGreaterThan(0);
    }
  });

  it("todo item tem título e endereço", () => {
    for (const f of FEEDS) {
      for (const item of lerFeed(amostra(f))) {
        expect(item.titulo.trim(), f).not.toBe("");
        expect(item.url, f).toMatch(/^https?:\/\//);
      }
    }
  });

  it("o endereço vem do <link>, NUNCA do <comments>", () => {
    // O WordPress emite <comments> com a mesma URL mais "#respond". Um
    // parser que pegue "a primeira URL do item" grava o endereço errado, e
    // aí o dedupe deixa de funcionar — cada execução regrava tudo.
    for (const item of lerFeed(amostra("cqcs"))) {
      expect(item.url).not.toContain("#respond");
    }
  });

  it("o endereço NÃO vem do <guid>", () => {
    // O CQCS emite <guid isPermaLink="false">. Usar guid como endereço
    // gravaria um identificador interno no lugar do link da matéria.
    const xml = amostra("cqcs");
    const guids = [...xml.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map((m) => m[1].trim());
    const urls = lerFeed(xml).map((i) => i.url);
    const naoPermalink = /isPermaLink="false"/.test(xml);
    if (naoPermalink && guids.length) {
      expect(urls).not.toContain(guids[0]);
    }
  });

  it("decodifica entidade no título", () => {
    // Título de jornal usa & o tempo todo. Sem decodificar, a tela mostra
    // "Susep &amp; CNseg".
    const todos = FEEDS.flatMap((f) => lerFeed(amostra(f))).map((i) => i.titulo);
    expect(todos.some((t) => t.includes("&amp;") || t.includes("&#"))).toBe(false);
  });

  it("o resumo vem sem HTML", () => {
    // <description> é CDATA com <p>, <a>, <img>. Guardar HTML cru na tabela
    // e jogar na tela é injeção esperando acontecer.
    for (const f of FEEDS) {
      for (const item of lerFeed(amostra(f))) {
        expect(item.resumo ?? "", f).not.toMatch(/<[a-z]/i);
      }
    }
  });

  it("a data sai em ISO, ou nula — nunca 'Invalid Date'", () => {
    for (const f of FEEDS) {
      for (const item of lerFeed(amostra(f))) {
        if (item.publicadoEm === null) continue;
        expect(Number.isNaN(new Date(item.publicadoEm).getTime()), f).toBe(false);
      }
    }
  });
});

describe("entradas que não são feed bom", () => {
  it("XML vazio devolve lista vazia, não estoura", () => {
    expect(lerFeed("")).toEqual([]);
    expect(lerFeed("<rss><channel></channel></rss>")).toEqual([]);
  });

  it("HTML no lugar de XML devolve lista vazia", () => {
    // Fonte fora do ar costuma devolver página de erro com 200.
    expect(lerFeed("<!DOCTYPE html><html><body>502</body></html>")).toEqual([]);
  });

  it("item sem link é descartado, e não derruba os outros", () => {
    const xml = `<rss><channel>
      <item><title>Sem link</title></item>
      <item><title>Com link</title><link>https://x.test/a</link></item>
    </channel></rss>`;
    const r = lerFeed(xml);
    expect(r).toHaveLength(1);
    expect(r[0].url).toBe("https://x.test/a");
  });

  it("item sem pubDate vira data nula, não Invalid Date", () => {
    const xml = `<rss><channel>
      <item><title>T</title><link>https://x.test/a</link></item>
    </channel></rss>`;
    expect(lerFeed(xml)[0].publicadoEm).toBeNull();
  });

  it("pubDate ilegível vira nulo", () => {
    const xml = `<rss><channel>
      <item><title>T</title><link>https://x.test/a</link><pubDate>ontem</pubDate></item>
    </channel></rss>`;
    expect(lerFeed(xml)[0].publicadoEm).toBeNull();
  });
});

/**
 * Comparar as duas cópias do parse não basta: elas podem concordar e estar
 * erradas juntas. Estes testes conferem contra as amostras reais que nada
 * de entidade chega à tela cru — o defeito já escapou duas vezes, primeiro
 * no título (referência numérica sem `htmlEntities`) e depois no resumo
 * (entidade dentro de CDATA, que o parser não toca por definição).
 */
describe("nenhuma entidade sobra nas amostras reais", () => {
  const AMOSTRAS = ["cqcs", "apolice", "sonho-seguro"] as const;

  it.each(AMOSTRAS)("nem no título nem no resumo de %s", async (amostra) => {
    const { readFileSync } = await import("node:fs");
    const itens = lerFeed(readFileSync(`tests/vigia/amostras/${amostra}.xml`, "utf8"));

    expect(itens.length).toBeGreaterThan(0);
    for (const i of itens) {
      expect(i.titulo, `título com entidade: ${i.titulo}`).not.toMatch(/&#?\w+;/);
      expect(i.resumo ?? "", `resumo com entidade em ${i.url}`).not.toMatch(/&#?\w+;/);
    }
  });
});
