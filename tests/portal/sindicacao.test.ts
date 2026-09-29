import { describe, expect, it } from "vitest";
import { escaparXml, itemDeRss, urlAbsoluta } from "@/lib/portal/sindicacao";

describe("URL absoluta para feed e sitemap", () => {
  it("junta origem e caminho sem barra dupla", () => {
    expect(urlAbsoluta("https://segreport.com.br", "/noticias/x")).toBe(
      "https://segreport.com.br/noticias/x"
    );
    expect(urlAbsoluta("https://segreport.com.br/", "/noticias/x")).toBe(
      "https://segreport.com.br/noticias/x"
    );
  });

  it("aceita caminho sem barra inicial", () => {
    expect(urlAbsoluta("https://segreport.com.br", "noticias/x")).toBe(
      "https://segreport.com.br/noticias/x"
    );
  });

  it("a raiz não vira barra dupla nem some", () => {
    expect(urlAbsoluta("https://segreport.com.br", "/")).toBe("https://segreport.com.br/");
  });
});

describe("escape de XML", () => {
  it("escapa os cinco caracteres que quebram XML", () => {
    expect(escaparXml(`a & b < c > d " e ' f`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e &apos; f"
    );
  });

  it("escapa o & primeiro, senão as outras entidades viram lixo", () => {
    // Trocar < por &lt; antes de & produziria &amp;lt; — o feed mostra o
    // código em vez do símbolo.
    expect(escaparXml("<")).toBe("&lt;");
    expect(escaparXml("&lt;")).toBe("&amp;lt;");
  });

  it("título com aspas de jornal não quebra o feed", () => {
    const t = escaparXml('Susep diz que "não há risco sistêmico" & adia regra');
    expect(t).not.toMatch(/[<>]/);
    expect(t).toContain("&quot;");
    expect(t).toContain("&amp;");
  });

  it("texto sem caractere especial passa intacto", () => {
    expect(escaparXml("Susep adia a regra de capital")).toBe("Susep adia a regra de capital");
  });
});

describe("item de RSS", () => {
  const materia = {
    slug: "susep-adia-regra",
    title: "Susep adia a regra & publica nota",
    excerpt: "O regulador recuou depois da consulta pública.",
    publishedAt: "2026-09-20T12:00:00Z",
    autor: "Da Redação",
    categoria: "Regulação",
  };

  it("monta um item com link absoluto e guid estável", () => {
    const xml = itemDeRss("https://segreport.com.br", materia);
    expect(xml).toContain("<link>https://segreport.com.br/noticias/susep-adia-regra</link>");
    expect(xml).toContain('<guid isPermaLink="true">https://segreport.com.br/noticias/susep-adia-regra</guid>');
  });

  it("escapa o título", () => {
    expect(itemDeRss("https://x.com", materia)).toContain("Susep adia a regra &amp; publica nota");
  });

  it("usa data no formato RFC 822, que é o que leitor de feed entende", () => {
    const xml = itemDeRss("https://x.com", materia);
    expect(xml).toMatch(/<pubDate>\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT<\/pubDate>/);
  });

  it("matéria sem data não gera pubDate inválido", () => {
    // `new Date(null).toUTCString()` devolve "Invalid Date", que envenena o
    // feed inteiro — alguns leitores descartam o arquivo todo.
    const xml = itemDeRss("https://x.com", { ...materia, publishedAt: null });
    expect(xml).not.toContain("Invalid Date");
    expect(xml).not.toContain("<pubDate>");
  });

  it("matéria sem resumo não gera description vazia", () => {
    const xml = itemDeRss("https://x.com", { ...materia, excerpt: null });
    expect(xml).not.toContain("<description></description>");
  });
});
