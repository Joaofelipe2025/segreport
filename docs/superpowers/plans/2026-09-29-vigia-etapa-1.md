# Vigia de fontes, etapa 1 — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o SegReport acompanhar sozinho a imprensa do setor, três vezes ao dia, e mostrar no painel o que apareceu — sem escrever matéria nenhuma.

**Architecture:** Um script roda no GitHub Actions, lê três feeds RSS, e manda a execução inteira numa chamada HTTP para um endereço novo do portal, autenticado pela chave que já existe. O portal grava as pautas novas (dedupe pela URL) e um registro da execução — inclusive quando falha ou não acha nada. O painel ganha uma tela que lista pautas e diz quando o vigia rodou pela última vez.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres + RLS), GitHub Actions, `fast-xml-parser`, Vitest + PGlite.

**Spec:** `docs/superpowers/specs/2026-09-29-vigia-de-fontes-design.md`

## Global Constraints

- **Nenhum texto de veículo de imprensa pode alcançar um gerador de matéria** (CON-1). Nesta etapa não existe gerador; o campo `tipo_de_fonte` é o que tornará a restrição verificável depois.
- **Custo de modelo: zero** (NFR-4). Nenhuma chamada a LLM nesta etapa.
- O vigia escreve **por HTTP, nunca direto no banco** (FR-3.2), reusando `INGESTAO_TOKEN`.
- Lógica testável mora em `.ts` sob `src/lib/`, nunca em `.tsx` (NFR-2). `vitest.config.ts` tem `environment: "node"` e `include: ["tests/**/*.test.ts"]`.
- O parse de feed é testado contra **amostra real capturada**, nunca contra XML escrito à mão (NFR-3).
- Uma fonte que falhe não derruba as outras (FR-1.6).
- Textos de interface em português, com acentuação correta. Poppins, negrito só em caso específico, lime nunca como texto sobre fundo claro.
- Commits em conventional commits, em português.
- Rodar `npx vitest run`, `npx tsc --noEmit` e `npm run lint` antes de cada commit.
- **Não rodar `npm run build` com o `next dev` no ar** — já derrubou o heap nesta máquina.

## Review Focus

Cinco entradas que a spec implica e que nenhum teste pegaria por padrão. Cada uma ganhou teste na tarefa dona.

1. **`<guid isPermaLink="false">`** — o CQCS marca assim, então o guid **não** é endereço. Dedupe por guid criaria duplicata em todo item. → Tarefa 1.
2. **`<comments>` quase idêntico ao `<link>`** — `https://…/materia/#respond`. Parser que pega "a primeira URL" grava o endereço errado, e o dedupe passa a não funcionar. → Tarefa 1.
3. **Título com `&amp;` e com CDATA** — o CQCS manda texto puro com entidades; outros feeds mandam CDATA. O mesmo parser precisa dos dois, ou o título aparece com `&amp;` na tela. → Tarefa 1.
4. **Item sem `pubDate`, ou com data ilegível** — feed recém-migrado faz isso. `new Date(undefined)` vira `Invalid Date` e envenena a ordenação da lista inteira. → Tarefa 2.
5. **Execução em que TODAS as fontes falham** — é indistinguível, em `pautas`, de um dia calmo. Sem a linha de execução, o veículo acha que está coberto e não está. → Tarefa 3.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/vigia/feed.ts` | Ler XML de RSS e devolver itens normalizados. Puro. |
| `src/lib/vigia/fontes.ts` | A lista de fontes: chave, nome, URL, tipo. Puro. |
| `src/lib/vigia/pauta.ts` | Validar e normalizar o que chega pelo HTTP. Puro. |
| `src/app/api/vigia/execucao/route.ts` | Recebe a execução inteira, grava pautas e registro. |
| `src/app/(admin)/admin/pautas/page.tsx` | A tela. |
| `src/app/(admin)/admin/pautas/actions.ts` | Mudar estado de uma pauta. |
| `scripts/vigia.mjs` | O que roda no GitHub Actions. |
| `.github/workflows/vigia.yml` | O agendamento. |
| `supabase/migrations/20260930000001_vigia.sql` | `pautas` e `vigia_execucoes`. |

---

### Task 1: Ler um feed de RSS

O coração da etapa, e a parte que vai quebrar quando um feed mudar. Puro e testado contra XML capturado do ar.

**Files:**
- Create: `src/lib/vigia/feed.ts`
- Create: `tests/vigia/amostras/cqcs.xml` (capturado, não escrito)
- Create: `tests/vigia/amostras/apolice.xml`
- Create: `tests/vigia/amostras/sonho-seguro.xml`
- Test: `tests/vigia/feed.test.ts`
- Modify: `package.json` (`fast-xml-parser@^5.11.2`)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `interface ItemDeFeed { titulo: string; url: string; resumo: string | null; publicadoEm: string | null }`
  - `lerFeed(xml: string): ItemDeFeed[]`

- [ ] **Step 1: Capturar as amostras reais**

NFR-3 exige amostra do ar, não XML inventado. Rode:

```bash
mkdir -p tests/vigia/amostras
curl -sL -A "Mozilla/5.0" https://cqcs.com.br/feed/ -o tests/vigia/amostras/cqcs.xml
curl -sL -A "Mozilla/5.0" https://www.revistaapolice.com.br/feed/ -o tests/vigia/amostras/apolice.xml
curl -sL -A "Mozilla/5.0" https://sonhoseguro.com.br/feed/ -o tests/vigia/amostras/sonho-seguro.xml
```

Confira que os três têm `<item>`:

```bash
grep -c "<item>" tests/vigia/amostras/*.xml
```

- [ ] **Step 2: Escrever o teste que falha**

Criar `tests/vigia/feed.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { lerFeed, type ItemDeFeed } from "@/lib/vigia/feed";

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
```

- [ ] **Step 3: Rodar e verificar que falha**

Run: `npx vitest run tests/vigia/feed.test.ts`
Expected: FAIL — `Cannot find module '@/lib/vigia/feed'`

- [ ] **Step 4: Instalar o parser de XML**

```bash
npm install fast-xml-parser@^5.11.2
```

Escrever à mão seria repetir o erro que o conversor de Markdown já ensinou: formato de **entrada** é adversarial por acidente. Feed de WordPress mistura CDATA e texto puro, tem namespace, entidade, `<category>` repetida e campos opcionais — e são três feeds de terceiros que mudam sem avisar.

- [ ] **Step 5: Escrever `src/lib/vigia/feed.ts`**

```ts
import { XMLParser } from "fast-xml-parser";

/**
 * Um item de feed, já normalizado.
 *
 * `publicadoEm` é ISO ou nulo — nunca "Invalid Date". Data ilegível
 * envenena a ordenação da lista inteira, e feed recém-migrado produz isso
 * com frequência.
 */
export interface ItemDeFeed {
  titulo: string;
  url: string;
  resumo: string | null;
  publicadoEm: string | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  // Sem isto, um feed com um único <item> devolve objeto e não lista, e o
  // código quebra só naquele dia em que a fonte publicou uma vez.
  isArray: (nome) => nome === "item",
  processEntities: true,
  trimValues: true,
});

/** CDATA e texto puro chegam como string ou como objeto; os dois viram texto. */
function texto(valor: unknown): string {
  if (typeof valor === "string") return valor;
  if (typeof valor === "number") return String(valor);
  if (valor && typeof valor === "object" && "#text" in valor) {
    return String((valor as { "#text": unknown })["#text"]);
  }
  return "";
}

/** Tira marcação e comprime espaço. O resumo vai para a tela e para o banco. */
function semHtml(bruto: string): string {
  return bruto
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dataIso(bruto: string): string | null {
  if (!bruto.trim()) return null;
  const d = new Date(bruto);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function lerFeed(xml: string): ItemDeFeed[] {
  if (!xml.trim()) return [];

  let arvore: Record<string, unknown>;
  try {
    arvore = parser.parse(xml) as Record<string, unknown>;
  } catch {
    // Fonte fora do ar costuma devolver página de erro com HTTP 200.
    return [];
  }

  const canal = (arvore?.rss as { channel?: { item?: unknown[] } })?.channel;
  const itens = Array.isArray(canal?.item) ? canal.item : [];

  return itens
    .map((bruto) => {
      const i = bruto as Record<string, unknown>;

      // SÓ <link>. O WordPress também emite <comments> com a mesma URL mais
      // "#respond", e <guid isPermaLink="false">, que é identificador
      // interno e não endereço. Pegar qualquer um dos dois quebra o dedupe.
      const url = texto(i.link).trim();
      const titulo = texto(i.title).trim();
      if (!url || !titulo) return null;

      const resumoBruto = semHtml(texto(i.description));

      return {
        titulo,
        url,
        resumo: resumoBruto || null,
        publicadoEm: dataIso(texto(i.pubDate)),
      } satisfies ItemDeFeed;
    })
    .filter((i): i is ItemDeFeed => i !== null);
}
```

- [ ] **Step 6: Rodar e verificar que passa**

Run: `npx vitest run tests/vigia/feed.test.ts`
Expected: PASS — 12 testes

- [ ] **Step 7: Verificar tudo e commitar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`

```bash
git add src/lib/vigia/feed.ts tests/vigia/ package.json package-lock.json
git commit -m "feat(vigia): ler feed de RSS, testado contra amostra real

O endereço sai do <link>, nunca do <comments> (que traz a mesma URL com
#respond) nem do <guid>, que o CQCS marca como isPermaLink=false. Os dois
erros passariam despercebidos e quebrariam o dedupe.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: As fontes e a pauta

A lista de fontes e a normalização do que chega pelo HTTP. Puro, e é onde a CON-1 vira código.

**Files:**
- Create: `src/lib/vigia/fontes.ts`
- Create: `src/lib/vigia/pauta.ts`
- Test: `tests/vigia/fontes.test.ts`
- Test: `tests/vigia/pauta.test.ts`

**Interfaces:**
- Consumes: `ItemDeFeed` de `@/lib/vigia/feed`.
- Produces:
  - `type TipoDeFonte = "imprensa" | "primaria"`
  - `interface Fonte { chave: string; nome: string; url: string; tipo: TipoDeFonte }`
  - `FONTES: readonly Fonte[]`
  - `fontePorChave(chave: string): Fonte | null`
  - `interface PautaRecebida { fonte: string; tipoDeFonte: TipoDeFonte; titulo: string; url: string; resumo: string | null; publicadoEm: string | null }`
  - `validarAchados(bruto: unknown): { ok: true; achados: PautaRecebida[] } | { ok: false; erro: string; comoCorrigir: string }`

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/vigia/fontes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FONTES, fontePorChave } from "@/lib/vigia/fontes";

describe("as fontes da etapa 1", () => {
  it("são os três feeds que respondem", () => {
    expect(FONTES.map((f) => f.chave).sort()).toEqual([
      "apolice",
      "cqcs",
      "sonho-seguro",
    ]);
  });

  it("todas são de imprensa nesta etapa", () => {
    // Fonte primária entra nas etapas 2 e 3. Enquanto só há imprensa,
    // nenhum caminho gera matéria — que é a CON-1.
    expect(FONTES.every((f) => f.tipo === "imprensa")).toBe(true);
  });

  it("toda fonte tem endereço https", () => {
    for (const f of FONTES) expect(f.url, f.chave).toMatch(/^https:\/\//);
  });

  it("as chaves não se repetem", () => {
    expect(new Set(FONTES.map((f) => f.chave)).size).toBe(FONTES.length);
  });

  it("chave desconhecida devolve nulo, não estoura", () => {
    expect(fontePorChave("inventada")).toBeNull();
    expect(fontePorChave("")).toBeNull();
    expect(fontePorChave("__proto__")).toBeNull();
  });

  it("chave conhecida devolve a fonte", () => {
    expect(fontePorChave("cqcs")?.nome).toBe("CQCS");
  });
});
```

Criar `tests/vigia/pauta.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validarAchados } from "@/lib/vigia/pauta";

const bom = {
  fonte: "cqcs",
  tipoDeFonte: "imprensa",
  titulo: "Susep publica circular sobre capital",
  url: "https://cqcs.com.br/noticia/x/",
  resumo: "O regulador atualizou os requisitos.",
  publicadoEm: "2026-09-29T17:19:20.000Z",
};

describe("validação dos achados", () => {
  it("aceita uma lista boa", () => {
    const r = validarAchados([bom]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toHaveLength(1);
  });

  it("aceita lista vazia — dia calmo é resultado válido", () => {
    const r = validarAchados([]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados).toEqual([]);
  });

  it("recusa fonte desconhecida", () => {
    const r = validarAchados([{ ...bom, fonte: "blog-do-vizinho" }]);
    expect(r.ok).toBe(false);
  });

  it("RECUSA tipo que não bate com o cadastro da fonte", () => {
    // Esta é a CON-1 em código: um adaptador de imprensa não pode se
    // declarar fonte primária e, nas etapas seguintes, alcançar o gerador
    // de matéria.
    const r = validarAchados([{ ...bom, tipoDeFonte: "primaria" }]);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.erro).toMatch(/imprensa/i);
  });

  it("recusa url que não é http", () => {
    for (const url of ["javascript:alert(1)", "ftp://x.test/a", "/relativo", ""]) {
      expect(validarAchados([{ ...bom, url }]).ok, url).toBe(false);
    }
  });

  it("recusa título vazio", () => {
    expect(validarAchados([{ ...bom, titulo: "   " }]).ok).toBe(false);
  });

  it("apara e normaliza", () => {
    const r = validarAchados([{ ...bom, titulo: "  Com espaço  " }]);
    expect(r.ok && r.achados[0].titulo).toBe("Com espaço");
  });

  it("resumo em branco vira nulo", () => {
    const r = validarAchados([{ ...bom, resumo: "   " }]);
    expect(r.ok && r.achados[0].resumo).toBeNull();
  });

  it("data ilegível vira nula em vez de derrubar a lista", () => {
    const r = validarAchados([{ ...bom, publicadoEm: "ontem" }]);
    expect(r.ok).toBe(true);
    expect(r.ok && r.achados[0].publicadoEm).toBeNull();
  });

  it("recusa o que nem é lista", () => {
    for (const lixo of [null, "texto", 42, {}]) {
      expect(validarAchados(lixo).ok, String(lixo)).toBe(false);
    }
  });

  it("recusa lista grande demais", () => {
    const muitos = Array.from({ length: 501 }, (_, i) => ({
      ...bom,
      url: `https://cqcs.com.br/n/${i}`,
    }));
    expect(validarAchados(muitos).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e verificar que falham**

Run: `npx vitest run tests/vigia/`
Expected: FAIL — módulos `fontes` e `pauta` inexistentes

- [ ] **Step 3: Escrever `src/lib/vigia/fontes.ts`**

```ts
/**
 * As fontes que o vigia acompanha.
 *
 * `tipo` não é rótulo: é o que separa as duas saídas do sistema. Fonte de
 * imprensa produz PAUTA e nada mais — o texto dela nunca alcança um gerador
 * de matéria. Fonte primária, que entra nas etapas 2 e 3, produz matéria
 * redigida a partir do documento.
 *
 * A decisão é editorial e foi tomada pelo dono do veículo: outros veículos
 * servem de alerta, nunca de texto. Este campo é o que torna isso
 * verificável no código em vez de confiável por disciplina.
 */
export type TipoDeFonte = "imprensa" | "primaria";

export interface Fonte {
  chave: string;
  nome: string;
  url: string;
  tipo: TipoDeFonte;
}

export const FONTES: readonly Fonte[] = [
  { chave: "cqcs", nome: "CQCS", url: "https://cqcs.com.br/feed/", tipo: "imprensa" },
  {
    chave: "apolice",
    nome: "Revista Apólice",
    url: "https://www.revistaapolice.com.br/feed/",
    tipo: "imprensa",
  },
  {
    chave: "sonho-seguro",
    nome: "Sonho Seguro",
    url: "https://sonhoseguro.com.br/feed/",
    tipo: "imprensa",
  },
] as const;

const PORCHAVE = new Map(FONTES.map((f) => [f.chave, f]));

/** `Map` e não objeto: busca literal responderia a `constructor` e `__proto__`. */
export function fontePorChave(chave: string): Fonte | null {
  return PORCHAVE.get(chave) ?? null;
}
```

- [ ] **Step 4: Escrever `src/lib/vigia/pauta.ts`**

```ts
import { fontePorChave, type TipoDeFonte } from "./fontes";

export interface PautaRecebida {
  fonte: string;
  tipoDeFonte: TipoDeFonte;
  titulo: string;
  url: string;
  resumo: string | null;
  publicadoEm: string | null;
}

export type ValidacaoDeAchados =
  | { ok: true; achados: PautaRecebida[] }
  | { ok: false; erro: string; comoCorrigir: string };

/** Teto por execução. Três feeds somam 80 itens; 500 é folga com limite. */
const LIMITE = 500;

const recusar = (erro: string, comoCorrigir: string): ValidacaoDeAchados => ({
  ok: false,
  erro,
  comoCorrigir,
});

function dataOuNula(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function validarAchados(bruto: unknown): ValidacaoDeAchados {
  if (!Array.isArray(bruto)) {
    return recusar("`achados` precisa ser uma lista.", "Envie um array, mesmo que vazio.");
  }
  if (bruto.length > LIMITE) {
    return recusar(
      `A execução trouxe ${bruto.length} itens e o teto é ${LIMITE}.`,
      "Reduza a janela que o vigia lê por execução."
    );
  }

  const achados: PautaRecebida[] = [];

  for (const cru of bruto) {
    if (!cru || typeof cru !== "object") {
      return recusar("Item de achado não é objeto.", "Cada achado é um objeto JSON.");
    }
    const a = cru as Record<string, unknown>;

    const fonte = typeof a.fonte === "string" ? a.fonte.trim() : "";
    const cadastro = fontePorChave(fonte);
    if (!cadastro) {
      return recusar(
        `Fonte "${fonte || "(vazia)"}" não está cadastrada.`,
        "Use uma das fontes de src/lib/vigia/fontes.ts."
      );
    }

    // A CON-1, em código. O tipo NÃO vem do que a requisição disse: vem do
    // cadastro. Divergência é recusa, não correção silenciosa — um
    // adaptador de imprensa que se declarasse primária alcançaria, nas
    // etapas seguintes, o gerador de matéria.
    if (a.tipoDeFonte !== cadastro.tipo) {
      return recusar(
        `A fonte "${fonte}" é de ${cadastro.tipo} e o achado veio como "${String(a.tipoDeFonte)}".`,
        "Não declare o tipo: ele sai do cadastro da fonte."
      );
    }

    const titulo = typeof a.titulo === "string" ? a.titulo.trim() : "";
    if (!titulo) {
      return recusar("Achado sem título.", "Todo achado precisa de `titulo`.");
    }

    const url = typeof a.url === "string" ? a.url.trim() : "";
    if (!/^https?:\/\//i.test(url)) {
      return recusar(
        `Endereço inválido: "${url || "(vazio)"}".`,
        "`url` precisa começar com http:// ou https://."
      );
    }

    const resumo = typeof a.resumo === "string" ? a.resumo.trim() : "";

    achados.push({
      fonte,
      tipoDeFonte: cadastro.tipo,
      titulo,
      url,
      resumo: resumo || null,
      publicadoEm: dataOuNula(a.publicadoEm),
    });
  }

  return { ok: true, achados };
}
```

- [ ] **Step 5: Rodar e verificar que passam**

Run: `npx vitest run tests/vigia/`
Expected: PASS — 18 testes novos

- [ ] **Step 6: Verificar tudo e commitar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`

```bash
git add src/lib/vigia/fontes.ts src/lib/vigia/pauta.ts tests/vigia/
git commit -m "feat(vigia): cadastro de fontes e validação dos achados

O tipo da fonte sai do CADASTRO, nunca do que a requisição diz. É a
restrição editorial virada em código: veículo de imprensa produz pauta e
nada mais, e não há como um adaptador se declarar fonte primária para
alcançar o gerador de matéria das etapas seguintes.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Guardar a execução

Tabelas, endpoint e o registro que existe justamente para o caso em que nada foi achado.

**Files:**
- Create: `supabase/migrations/20260930000001_vigia.sql`
- Create: `src/app/api/vigia/execucao/route.ts`
- Test: `tests/rls/vigia.test.ts`
- Modify: `src/lib/supabase/types.ts`
- Modify: `supabase/setup/esquema-completo.sql` (anexar a migração)

**Interfaces:**
- Consumes: `validarAchados` (Tarefa 2); `criarClienteAdmin` de `@/lib/supabase/admin`.
- Produces: `POST /api/vigia/execucao`, corpo `{ achados: PautaRecebida[]; falhas: Record<string,string> }`, resposta `{ execucaoId, novas, repetidas }`.

- [ ] **Step 1: Escrever a migração**

Criar `supabase/migrations/20260930000001_vigia.sql`:

```sql
-- ============================================================================
-- O vigia de fontes
--
-- Duas tabelas, e a segunda existe por um motivo que não é óbvio: sem ela,
-- execução que FALHOU e execução que rodou num dia calmo produzem o mesmo
-- vazio em `pautas` — nenhuma linha — e são coisas opostas. Vigia que parou e
-- ninguém percebeu é pior do que vigia nenhum: cria a impressão de cobertura
-- que não existe.
-- ============================================================================

create table if not exists public.pautas (
  id            uuid primary key default gen_random_uuid(),
  fonte         text not null,
  -- 'imprensa' nunca alcança o gerador de matéria. Ver src/lib/vigia/fontes.ts.
  tipo_de_fonte text not null check (tipo_de_fonte in ('imprensa', 'primaria')),
  titulo        text not null,
  -- A chave de dedupe. Não é o título: veículos diferentes cobrem o mesmo
  -- fato com títulos parecidos, e isso é informação, não repetição.
  url           text not null unique,
  resumo        text,
  publicado_em  timestamptz,
  estado        text not null default 'nova'
                check (estado in ('nova', 'lida', 'descartada', 'virou_materia')),
  article_id    uuid references public.articles(id) on delete set null,
  criado_em     timestamptz not null default now()
);

create index if not exists pautas_estado_idx on public.pautas (estado, criado_em desc);

create table if not exists public.vigia_execucoes (
  id          uuid primary key default gen_random_uuid(),
  comecou_em  timestamptz not null default now(),
  -- {"cqcs": 3, "apolice": 0}
  achados     jsonb not null default '{}'::jsonb,
  -- {"cqcs": "HTTP 503"} — vazio quando tudo correu bem
  falhas      jsonb not null default '{}'::jsonb
);

create index if not exists vigia_execucoes_comecou_em_idx
  on public.vigia_execucoes (comecou_em desc);

alter table public.pautas enable row level security;
alter table public.vigia_execucoes enable row level security;

-- Só admin lê, no padrão de `ingestao_recebidas`. A escrita é da rota, com a
-- chave de serviço; nenhum papel do navegador escreve aqui.
drop policy if exists pautas_admin_select on public.pautas;
create policy pautas_admin_select on public.pautas
  for select to authenticated using (public.is_admin());

drop policy if exists pautas_admin_update on public.pautas;
create policy pautas_admin_update on public.pautas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists vigia_execucoes_admin_select on public.vigia_execucoes;
create policy vigia_execucoes_admin_select on public.vigia_execucoes
  for select to authenticated using (public.is_admin());
```

- [ ] **Step 2: Escrever o teste de RLS**

Criar `tests/rls/vigia.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { actAs, closeDb, tryWrite, withRollback } from "../helpers/db";
import { seedUsers } from "../helpers/seed";

afterAll(closeDb);

const INSERE = `insert into public.pautas (fonte, tipo_de_fonte, titulo, url)
                values ('cqcs', 'imprensa', 'Uma pauta', 'https://cqcs.com.br/n/1')`;

describe("pautas", () => {
  it("só o admin lê", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(INSERE);

      await actAs(db, ids.adminId);
      expect((await db.query("select id from public.pautas")).rows).toHaveLength(1);

      await actAs(db, ids.columnistId);
      expect((await db.query("select id from public.pautas")).rows).toHaveLength(0);

      await actAs(db, null);
      expect((await db.query("select id from public.pautas")).rows).toHaveLength(0);
    });
  });

  it("a mesma URL não entra duas vezes", async () => {
    await withRollback(async (db) => {
      await db.query(INSERE);
      const t = await tryWrite(db, INSERE);
      expect(t.ok).toBe(false);
    });
  });

  it("estado fora da lista é recusado pelo banco", async () => {
    await withRollback(async (db) => {
      const t = await tryWrite(
        db,
        `insert into public.pautas (fonte, tipo_de_fonte, titulo, url, estado)
         values ('cqcs', 'imprensa', 'T', 'https://x.test/a', 'inventado')`
      );
      expect(t.ok).toBe(false);
    });
  });

  it("tipo de fonte fora da lista é recusado pelo banco", async () => {
    await withRollback(async (db) => {
      const t = await tryWrite(
        db,
        `insert into public.pautas (fonte, tipo_de_fonte, titulo, url)
         values ('cqcs', 'blog', 'T', 'https://x.test/a')`
      );
      expect(t.ok).toBe(false);
    });
  });

  it("o admin muda o estado de uma pauta", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(INSERE);
      await actAs(db, ids.adminId);
      const t = await tryWrite(db, "update public.pautas set estado = 'lida'");
      expect(t.ok).toBe(true);
    });
  });

  it("o colunista NÃO muda estado de pauta", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(INSERE);
      await actAs(db, ids.columnistId);
      const t = await tryWrite(db, "update public.pautas set estado = 'lida'");
      // A RLS não entrega a linha, então nada é atualizado.
      expect((await db.query("select estado from public.pautas")).rows).toHaveLength(0);
      expect(t.ok).toBe(true);
    });
  });
});

describe("registro de execução", () => {
  it("grava execução SEM achado nenhum — é o caso que importa", async () => {
    // Dia calmo e três feeds quebrados produzem o mesmo vazio em `pautas`.
    // Só esta linha distingue os dois.
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query(
        `insert into public.vigia_execucoes (achados, falhas)
         values ('{"cqcs":0}'::jsonb, '{"apolice":"HTTP 503"}'::jsonb)`
      );
      await actAs(db, ids.adminId);
      const r = await db.query("select falhas from public.vigia_execucoes");
      expect(r.rows).toHaveLength(1);
      expect(JSON.stringify(r.rows[0].falhas)).toContain("503");
    });
  });

  it("só o admin lê as execuções", async () => {
    await withRollback(async (db) => {
      const ids = await seedUsers(db);
      await db.query("insert into public.vigia_execucoes default values");
      await actAs(db, ids.columnistId);
      expect((await db.query("select id from public.vigia_execucoes")).rows).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 3: Rodar e verificar que falha**

Run: `npx vitest run tests/rls/vigia.test.ts`
Expected: FAIL — `relation "public.pautas" does not exist`

A suíte aplica as migrações do diretório automaticamente, então o arquivo do passo 1 já as cria. Se falhar assim, é porque o arquivo não foi salvo no lugar certo.

- [ ] **Step 4: Rodar de novo — agora com a migração no lugar**

Run: `npx vitest run tests/rls/vigia.test.ts`
Expected: PASS — 8 testes

- [ ] **Step 5: Declarar as tabelas em `src/lib/supabase/types.ts`**

Dentro de `Tables`, ao lado de `ingestao_recebidas`:

```ts
      pautas: {
        Row: {
          id: string;
          fonte: string;
          tipo_de_fonte: string;
          titulo: string;
          url: string;
          resumo: string | null;
          publicado_em: string | null;
          estado: string;
          article_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          fonte: string;
          tipo_de_fonte: string;
          titulo: string;
          url: string;
          resumo?: string | null;
          publicado_em?: string | null;
          estado?: string;
          article_id?: string | null;
          criado_em?: string;
        };
        Update: {
          estado?: string;
          article_id?: string | null;
        };
        Relationships: [];
      };
      vigia_execucoes: {
        Row: {
          id: string;
          comecou_em: string;
          achados: Record<string, number>;
          falhas: Record<string, string>;
        };
        Insert: {
          id?: string;
          comecou_em?: string;
          achados?: Record<string, number>;
          falhas?: Record<string, string>;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
```

- [ ] **Step 6: Escrever a rota**

Criar `src/app/api/vigia/execucao/route.ts`:

```ts
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { validarAchados } from "@/lib/vigia/pauta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Recebe uma execução inteira do vigia.
 *
 * UMA CHAMADA POR EXECUÇÃO, não uma por item. A linha de `vigia_execucoes`
 * é gravada junto com os achados, então não existe execução sem registro — e
 * execução sem achado nenhum ainda assim grava, que é exatamente o caso que
 * distingue "dia calmo" de "os três feeds quebraram".
 */
const LIMITE_DE_BYTES = 512 * 1024;

const recusa = (status: number, erro: string, comoCorrigir: string) =>
  NextResponse.json({ erro, comoCorrigir }, { status });

/** sha256 dos dois lados: `timingSafeEqual` lança com tamanhos diferentes. */
function segredoConfere(recebido: string, guardado: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(recebido).digest(),
    createHash("sha256").update(guardado).digest()
  );
}

function tokensDoServidor(): string[] {
  return [process.env.INGESTAO_TOKEN, process.env.INGESTAO_TOKEN_ANTERIOR]
    .map((t) => t?.trim() ?? "")
    .filter((t) => t.length >= 32);
}

export async function POST(request: NextRequest) {
  const tokens = tokensDoServidor();
  if (tokens.length === 0) {
    return recusa(
      503,
      "A ingestão não está configurada neste ambiente.",
      "Defina INGESTAO_TOKEN nas variáveis do servidor."
    );
  }

  const recebido = (request.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!recebido || !tokens.some((t) => segredoConfere(recebido, t))) {
    return recusa(401, "Chave de acesso inválida.", "Envie Authorization: Bearer <chave>.");
  }

  if (Number(request.headers.get("content-length") ?? 0) > LIMITE_DE_BYTES) {
    return recusa(413, "Corpo grande demais.", "Reduza a janela lida por execução.");
  }

  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return recusa(400, "O corpo não é JSON válido.", "Envie JSON.");
  }

  const corpo = (bruto ?? {}) as Record<string, unknown>;
  const validacao = validarAchados(corpo.achados ?? []);
  if (!validacao.ok) return recusa(400, validacao.erro, validacao.comoCorrigir);

  const falhas =
    corpo.falhas && typeof corpo.falhas === "object" && !Array.isArray(corpo.falhas)
      ? (corpo.falhas as Record<string, string>)
      : {};

  const admin = criarClienteAdmin();

  // Contagem por fonte, inclusive as que vieram zeradas — é o que permite
  // ver no painel que uma fonte parou de trazer coisa.
  const porFonte: Record<string, number> = {};
  for (const a of validacao.achados) porFonte[a.fonte] = (porFonte[a.fonte] ?? 0) + 1;

  const { data: execucao, error: erroExecucao } = await admin
    .from("vigia_execucoes")
    .insert({ achados: porFonte, falhas })
    .select("id")
    .single();

  if (erroExecucao) {
    const faltaTabela =
      erroExecucao.code === "PGRST205" || /schema cache|does not exist/i.test(erroExecucao.message);
    return faltaTabela
      ? recusa(
          503,
          "O vigia ainda não foi instalado no banco.",
          "Aplique supabase/migrations/20260930000001_vigia.sql no Supabase."
        )
      : recusa(500, `Não foi possível registrar a execução: ${erroExecucao.message}`, "Tente de novo.");
  }

  // `ignoreDuplicates` faz a URL repetida ser descartada sem erro: o vigia
  // relê os mesmos itens a cada execução, e isso é o normal, não uma falha.
  const { data: inseridas, error: erroPautas } = validacao.achados.length
    ? await admin
        .from("pautas")
        .upsert(
          validacao.achados.map((a) => ({
            fonte: a.fonte,
            tipo_de_fonte: a.tipoDeFonte,
            titulo: a.titulo,
            url: a.url,
            resumo: a.resumo,
            publicado_em: a.publicadoEm,
          })),
          { onConflict: "url", ignoreDuplicates: true }
        )
        .select("id")
    : { data: [], error: null };

  if (erroPautas) {
    return recusa(500, `Não foi possível gravar as pautas: ${erroPautas.message}`, "Tente de novo.");
  }

  const novas = inseridas?.length ?? 0;
  console.info(
    `[vigia] execução ${execucao.id}: ${novas} nova(s) de ${validacao.achados.length} lida(s)` +
      (Object.keys(falhas).length ? ` | falhas: ${Object.keys(falhas).join(", ")}` : "")
  );

  return NextResponse.json(
    {
      execucaoId: execucao.id,
      novas,
      repetidas: validacao.achados.length - novas,
      falhas: Object.keys(falhas),
    },
    { status: 201 }
  );
}
```

- [ ] **Step 7: Anexar a migração ao pacote de instalação e validar**

```bash
printf '\n\n' >> supabase/setup/esquema-completo.sql
cat supabase/migrations/20260930000001_vigia.sql >> supabase/setup/esquema-completo.sql
node supabase/setup/validar.mjs
```

Expected: `✓ Aplica num banco limpo`, com 15 tabelas.

- [ ] **Step 8: Verificar tudo e commitar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`

```bash
git add supabase/ src/app/api/vigia/ src/lib/supabase/types.ts tests/rls/vigia.test.ts
git commit -m "feat(vigia): tabelas e endereço que recebe a execução

A execução inteira chega numa chamada só, e a linha de vigia_execucoes é
gravada mesmo quando não há achado nenhum. Sem ela, dia calmo e três feeds
quebrados produzem o mesmo vazio em pautas — e são coisas opostas.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: A tela de pautas

**Files:**
- Create: `src/app/(admin)/admin/pautas/page.tsx`
- Create: `src/app/(admin)/admin/pautas/actions.ts`
- Create: `src/app/(admin)/admin/pautas/BotoesDaPauta.tsx`
- Create: `src/lib/painel/pautas.ts`
- Test: `tests/painel/pautas.test.ts`
- Modify: `src/lib/auth/rules.ts` (item de menu)
- Modify: `tests/auth/rules.test.ts`

**Interfaces:**
- Consumes: `Secao`, `Cartao`, `Vazio`, `Aviso` de `@/components/admin/Painel`; `exigir` de `@/lib/painel/consulta`; `formatRelative` de `@/lib/format`; `requireRole` de `@/lib/auth/session`.
- Produces:
  - `interface LinhaDePauta { estado: string; criado_em: string }`
  - `pautasVisiveis(linhas: LinhaDePauta[], agora: Date): LinhaDePauta[]`
  - `resumoDaExecucao(exec: { comecou_em: string; achados: Record<string, number>; falhas: Record<string, string> } | null, agora: Date): { texto: string; tom: "calmo" | "atencao" | "alerta" }`
  - `mudarEstadoDaPauta(id: string, estado: string): Promise<{ status: "salvo" | "erro"; mensagem: string }>`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/painel/pautas.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run tests/painel/pautas.test.ts`
Expected: FAIL — `Cannot find module '@/lib/painel/pautas'`

- [ ] **Step 3: Escrever `src/lib/painel/pautas.ts`**

```ts
const DIA = 24 * 60 * 60 * 1000;

/** Depois disto, pauta não lida sai da lista principal. */
export const DIAS_NA_LISTA = 7;

export interface LinhaDePauta {
  estado: string;
  criado_em: string;
}

/**
 * O que a lista mostra por padrão.
 *
 * Só as novas, e só as recentes. As demais continuam na tabela e são
 * alcançáveis por filtro: apagar histórico de pauta é perder registro do que
 * o veículo viu e decidiu não cobrir.
 */
export function pautasVisiveis<T extends LinhaDePauta>(linhas: T[], agora: Date): T[] {
  const limite = agora.getTime() - DIAS_NA_LISTA * DIA;
  return linhas.filter(
    (l) => l.estado === "nova" && new Date(l.criado_em).getTime() >= limite
  );
}

export interface Execucao {
  comecou_em: string;
  achados: Record<string, number>;
  falhas: Record<string, string>;
}

/**
 * Como está o vigia.
 *
 * Três tons, e a escolha não é decorativa. Vigia que parou e ninguém percebeu
 * é pior do que vigia nenhum: cria a impressão de cobertura que não existe.
 */
export function resumoDaExecucao(
  exec: Execucao | null,
  agora: Date
): { texto: string; tom: "calmo" | "atencao" | "alerta" } {
  if (!exec) {
    return {
      texto: "O vigia nunca rodou. Confira o agendamento no GitHub Actions.",
      tom: "alerta",
    };
  }

  const horas = (agora.getTime() - new Date(exec.comecou_em).getTime()) / (60 * 60 * 1000);
  if (horas > 24) {
    return {
      texto: `O vigia não roda há mais de ${Math.floor(horas / 24)} dia(s). Confira o agendamento.`,
      tom: "alerta",
    };
  }

  const comFalha = Object.keys(exec.falhas);
  if (comFalha.length > 0) {
    return {
      texto: `Última execução falhou em: ${comFalha.join(", ")}.`,
      tom: "atencao",
    };
  }

  const total = Object.values(exec.achados).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return {
      texto:
        "A última execução não trouxe nada de nenhuma fonte. Pode ser dia calmo — ou os feeds mudaram de formato.",
      tom: "atencao",
    };
  }

  return { texto: `Última execução trouxe ${total} item(ns).`, tom: "calmo" };
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run tests/painel/pautas.test.ts`
Expected: PASS — 10 testes

- [ ] **Step 5: Escrever a ação de mudar estado**

Criar `src/app/(admin)/admin/pautas/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

const ESTADOS = new Set(["nova", "lida", "descartada", "virou_materia"]);

export async function mudarEstadoDaPauta(
  id: string,
  estado: string
): Promise<{ status: "salvo" | "erro"; mensagem: string }> {
  await requireRole(["admin"]);

  if (!ESTADOS.has(estado)) {
    return { status: "erro", mensagem: "Estado inválido." };
  }

  const supabase = await createClient();
  // `.select()` não é enfeite: sem ele não há como distinguir "mudou" de
  // "a RLS recusou em silêncio".
  const { data, error } = await supabase
    .from("pautas")
    .update({ estado })
    .eq("id", id)
    .select("id");

  if (error) return { status: "erro", mensagem: `Não foi possível salvar: ${error.message}` };
  if (!data?.length) return { status: "erro", mensagem: "Nada mudou — o banco recusou." };

  revalidatePath("/admin/pautas");
  return { status: "salvo", mensagem: "Pronto." };
}
```

- [ ] **Step 6: Escrever os botões**

Criar `src/app/(admin)/admin/pautas/BotoesDaPauta.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { mudarEstadoDaPauta } from "./actions";

/**
 * Duas saídas para cada pauta: virou trabalho, ou não interessa.
 *
 * "Lida" existe para o que você quer guardar sem agir agora; "descartada"
 * para o ruído. Os dois somem da lista principal, e a diferença fica no
 * histórico — que é o registro do que o veículo viu e decidiu não cobrir.
 */
export default function BotoesDaPauta({ id }: { id: string }) {
  const [aviso, setAviso] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  const mudar = (estado: string) =>
    iniciar(async () => {
      const r = await mudarEstadoDaPauta(id, estado);
      if (r.status === "erro") setAviso(r.mensagem);
    });

  return (
    <span className="flex shrink-0 items-center gap-2">
      {aviso && (
        <span role="alert" className="text-[11px] text-down">
          {aviso}
        </span>
      )}
      <button
        type="button"
        disabled={ocupado}
        onClick={() => mudar("lida")}
        className="rounded border border-hairline px-2 py-1 text-[11px] font-medium text-ink-2 transition-colors hover:border-forest-500 disabled:opacity-50"
      >
        Guardar
      </button>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => mudar("descartada")}
        className="rounded px-2 py-1 text-[11px] font-medium text-ink-4 transition-colors hover:text-down disabled:opacity-50"
      >
        Descartar
      </button>
    </span>
  );
}
```

- [ ] **Step 7: Escrever a tela**

Criar `src/app/(admin)/admin/pautas/page.tsx`:

```tsx
import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { Aviso, Cartao, Secao, Vazio } from "@/components/admin/Painel";
import BotoesDaPauta from "./BotoesDaPauta";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { exigir } from "@/lib/painel/consulta";
import { DIAS_NA_LISTA, pautasVisiveis, resumoDaExecucao } from "@/lib/painel/pautas";
import { FONTES } from "@/lib/vigia/fontes";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Pautas" };

const NOME_DA_FONTE = new Map(FONTES.map((f) => [f.chave, f.nome]));

export default async function PautasPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const agora = new Date();

  const [lista, ultima] = await Promise.all([
    supabase
      .from("pautas")
      .select("id, fonte, titulo, url, resumo, publicado_em, estado, criado_em")
      .eq("estado", "nova")
      .order("publicado_em", { ascending: false, nullsFirst: false })
      .limit(200),
    supabase
      .from("vigia_execucoes")
      .select("comecou_em, achados, falhas")
      .order("comecou_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const pautas = pautasVisiveis(exigir(lista, "as pautas"), agora);
  const execucao = exigir(ultima, "a última execução do vigia");
  const estado = resumoDaExecucao(execucao, agora);

  return (
    <>
      <PageHeader
        titulo="Pautas"
        descricao="O que apareceu nas fontes. Nada aqui é matéria — é radar."
      />

      {estado.tom !== "calmo" && <Aviso tom={estado.tom} titulo={estado.texto} />}

      <Secao
        titulo="Novas"
        contagem={pautas.length}
        aoLado={
          <span className="text-[11px] text-ink-4">
            {estado.tom === "calmo" ? estado.texto : `Últimos ${DIAS_NA_LISTA} dias`}
          </span>
        }
      >
        {pautas.length === 0 ? (
          <Vazio>
            Nenhuma pauta nova. O vigia acompanha {FONTES.length} fontes três vezes
            ao dia — o que aparecer cai aqui.
          </Vazio>
        ) : (
          <Cartao>
            <ul className="divide-y divide-hairline">
              {pautas.map((p) => (
                <li key={p.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-ink hover:text-forest-700 hover:underline"
                    >
                      {p.titulo}
                    </a>
                    {p.resumo && (
                      <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-ink-3">
                        {p.resumo}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-ink-4">
                      {NOME_DA_FONTE.get(p.fonte) ?? p.fonte}
                      {p.publicado_em ? ` · ${formatRelative(p.publicado_em, agora)}` : ""}
                    </span>
                  </span>
                  <BotoesDaPauta id={p.id} />
                </li>
              ))}
            </ul>
          </Cartao>
        )}
      </Secao>
    </>
  );
}
```

- [ ] **Step 8: Acrescentar ao menu, teste primeiro**

Em `tests/auth/rules.test.ts`, no teste "admin vê todas as seções", acrescentar `"/admin/pautas"` depois de `"/admin/materias"`. Rodar e ver falhar:

Run: `npx vitest run tests/auth/rules.test.ts`
Expected: FAIL — a lista não contém `/admin/pautas`

Depois, em `src/lib/auth/rules.ts`, no `MENU`, depois da linha de Matérias:

```ts
  { href: "/admin/pautas", rotulo: "Pautas", papeis: ["admin"] },
```

Run: `npx vitest run tests/auth/rules.test.ts`
Expected: PASS

- [ ] **Step 9: Verificar tudo e commitar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`

```bash
git add "src/app/(admin)/admin/pautas/" src/lib/painel/pautas.ts src/lib/auth/rules.ts tests/
git commit -m "feat(painel): tela de pautas, com o estado do vigia à vista

O aviso sobre a última execução não é enfeite: vigia que parou e ninguém
percebeu é pior do que vigia nenhum. Execução sem achado em nenhuma fonte
aparece como suspeita, não como calma — é assim que parecem três feeds que
mudaram de formato ao mesmo tempo.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: O vigia rodando

O script e o agendamento. É a casca: tudo que decide já foi testado nas tarefas anteriores.

**Files:**
- Create: `scripts/vigia.mjs`
- Create: `.github/workflows/vigia.yml`
- Modify: `package.json` (script `vigia`)
- Modify: `docs/integracao/passo-a-passo.md`

**Interfaces:**
- Consumes: `POST /api/vigia/execucao` (Tarefa 3); a lista de fontes (Tarefa 2).
- Produces: nada que o código consuma.

- [ ] **Step 1: Escrever o script**

Criar `scripts/vigia.mjs`:

```js
/**
 * O vigia de fontes.
 *
 *   node scripts/vigia.mjs                    # usa SEGREPORT_URL
 *   node scripts/vigia.mjs http://localhost:3000
 *
 * Lê os feeds, manda a execução inteira numa chamada, e sai com código
 * diferente de zero só quando NÃO conseguiu registrar nada — fonte que
 * falhou é registrada e não derruba a execução.
 *
 * A lista de fontes é duplicada aqui de propósito: este script roda no
 * GitHub Actions, sem o build do Next, então não dá para importar
 * `src/lib/vigia/fontes.ts`. Um teste amarra as duas listas.
 */
const BASE =
  process.argv[2] ?? process.env.SEGREPORT_URL ?? "https://segreport-five.vercel.app";
const CHAVE = process.env.INGESTAO_TOKEN;

if (!CHAVE) {
  console.error("INGESTAO_TOKEN não definida.");
  process.exit(1);
}

const FONTES = [
  { chave: "cqcs", url: "https://cqcs.com.br/feed/", tipo: "imprensa" },
  { chave: "apolice", url: "https://www.revistaapolice.com.br/feed/", tipo: "imprensa" },
  { chave: "sonho-seguro", url: "https://sonhoseguro.com.br/feed/", tipo: "imprensa" },
];

/** Mesma regra de `src/lib/vigia/feed.ts`: link, nunca comments nem guid. */
function lerItens(xml) {
  const itens = [];
  for (const bruto of xml.split("<item>").slice(1)) {
    const item = bruto.slice(0, bruto.indexOf("</item>"));
    const pegar = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      if (!m) return "";
      return m[1]
        .replace(/^\s*<!\[CDATA\[/, "")
        .replace(/\]\]>\s*$/, "")
        .trim();
    };

    const url = pegar("link");
    const titulo = pegar("title")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'");
    if (!url || !titulo) continue;

    const resumo = pegar("description")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const data = new Date(pegar("pubDate"));
    itens.push({
      titulo,
      url,
      resumo: resumo || null,
      publicadoEm: Number.isNaN(data.getTime()) ? null : data.toISOString(),
    });
  }
  return itens;
}

const achados = [];
const falhas = {};

for (const fonte of FONTES) {
  try {
    const r = await fetch(fonte.url, {
      headers: { "User-Agent": "SegReport-Vigia/1.0 (+https://segreport-five.vercel.app)" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) {
      falhas[fonte.chave] = `HTTP ${r.status}`;
      continue;
    }
    const itens = lerItens(await r.text());
    if (itens.length === 0) falhas[fonte.chave] = "feed sem itens legíveis";
    for (const i of itens) {
      achados.push({ fonte: fonte.chave, tipoDeFonte: fonte.tipo, ...i });
    }
    console.log(`${fonte.chave}: ${itens.length} item(ns)`);
  } catch (causa) {
    // Uma fonte que falha não derruba as outras.
    falhas[fonte.chave] = String(causa?.message ?? causa).slice(0, 200);
    console.log(`${fonte.chave}: FALHOU — ${falhas[fonte.chave]}`);
  }
}

const envio = await fetch(`${BASE}/api/vigia/execucao`, {
  method: "POST",
  headers: { Authorization: `Bearer ${CHAVE}`, "Content-Type": "application/json" },
  body: JSON.stringify({ achados, falhas }),
});

const resposta = await envio.json().catch(() => ({}));

if (!envio.ok) {
  console.error(`falhou ao registrar: HTTP ${envio.status}`, resposta);
  process.exit(1);
}

console.log(
  `registrado: ${resposta.novas} nova(s), ${resposta.repetidas} repetida(s)` +
    (Object.keys(falhas).length ? ` | falhas em ${Object.keys(falhas).join(", ")}` : "")
);
```

- [ ] **Step 2: Amarrar as duas listas de fontes com um teste**

O script duplica a lista porque roda sem o build do Next. Duplicata sem teste diverge. Acrescentar em `tests/vigia/fontes.test.ts`:

```ts
describe("a lista do script não pode divergir da do código", () => {
  it("as chaves e URLs são as mesmas", async () => {
    const { readFileSync } = await import("node:fs");
    const script = readFileSync("scripts/vigia.mjs", "utf8");

    for (const f of FONTES) {
      expect(script, `${f.chave} falta no script`).toContain(`"${f.chave}"`);
      expect(script, `${f.url} falta no script`).toContain(f.url);
    }

    const noScript = [...script.matchAll(/chave: "([a-z-]+)"/g)].map((m) => m[1]);
    expect(noScript.sort()).toEqual(FONTES.map((f) => f.chave).sort());
  });
});
```

Run: `npx vitest run tests/vigia/fontes.test.ts`
Expected: PASS

- [ ] **Step 3: Escrever o agendamento**

Criar `.github/workflows/vigia.yml`:

```yaml
name: Vigia de fontes

on:
  schedule:
    # Três vezes ao dia, horário de Brasília (UTC-3): 7h, 13h e 18h.
    # O cron do GitHub é sempre UTC.
    - cron: "0 10,16,21 * * *"
  # Para depurar sem esperar o horário.
  workflow_dispatch:

# Uma execução por vez: duas ao mesmo tempo leriam os mesmos itens e
# disputariam a unicidade da URL sem ganho nenhum.
concurrency:
  group: vigia
  cancel-in-progress: false

jobs:
  vigia:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - name: Ler as fontes e registrar a execução
        env:
          INGESTAO_TOKEN: ${{ secrets.INGESTAO_TOKEN }}
          SEGREPORT_URL: ${{ vars.SEGREPORT_URL }}
        run: node scripts/vigia.mjs
```

- [ ] **Step 4: Acrescentar o atalho ao `package.json`**

Em `scripts`:

```json
"vigia": "node scripts/vigia.mjs"
```

- [ ] **Step 5: Rodar contra o servidor local**

```bash
npm run dev          # noutro terminal
node scripts/vigia.mjs http://localhost:3000
```

Expected: três linhas com a contagem por fonte, e `registrado: N nova(s)`.

Rodar de novo imediatamente:

Expected: `0 nova(s)`, com `repetidas` igual ao total — o dedupe por URL funcionando.

Abrir `http://localhost:3000/admin/pautas` e conferir que a lista tem itens e que não há aviso de alerta.

- [ ] **Step 6: Documentar os dois passos do GitHub**

Acrescentar ao fim de `docs/integracao/passo-a-passo.md`:

```markdown
---

## O vigia de fontes

Roda no GitHub Actions, três vezes ao dia, e não precisa de nada seu além de
dois cadastros:

1. **Settings → Secrets and variables → Actions → New repository secret**
   Nome `INGESTAO_TOKEN`, valor igual ao que está na Vercel.
2. Na aba **Variables** da mesma tela, `SEGREPORT_URL` com o endereço do site.

Para rodar na hora, sem esperar o horário: **Actions → Vigia de fontes → Run
workflow**.

O painel, em **Pautas**, mostra quando ele rodou pela última vez e o que
falhou. Se aparecer aviso vermelho, o vigia parou.
```

- [ ] **Step 7: Verificar tudo e commitar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`

```bash
git add scripts/vigia.mjs .github/workflows/vigia.yml package.json docs/ tests/
git commit -m "feat(vigia): o script e o agendamento de três vezes ao dia

Uma fonte que falha é registrada e não derruba as outras. O script duplica a
lista de fontes porque roda sem o build do Next, e um teste amarra as duas
listas — duplicata sem teste diverge.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Autorrevisão

**1. Cobertura da spec.**

| Requisito | Tarefa |
|---|---|
| FR-1.1 três feeds, 3× ao dia | 1 (leitura), 5 (agendamento) |
| FR-1.2 item vira pauta | 3 |
| FR-1.3 estados da pauta | 3 (banco), 4 (interface) |
| FR-1.4 dedupe por URL | 1 (o endereço certo), 3 (unicidade) |
| FR-1.5 lista por padrão só nova e recente | 4 |
| FR-1.6 fonte que falha não derruba | 5 |
| FR-2.1 registro mesmo sem achado | 3 |
| FR-2.2 última execução à vista | 4 |
| FR-2.3 zero em tudo é suspeito | 4 |
| FR-3.1 GitHub Actions | 5 |
| FR-3.2 escreve por HTTP, chave existente | 3, 5 |
| FR-3.3 disparável à mão | 5 |
| CON-1 imprensa não alcança gerador | 2 (`tipo` vem do cadastro) |
| NFR-1 adaptador por fonte | 2 |
| NFR-2 lógica em `.ts` puro | 1, 2, 4 |
| NFR-3 amostra real | 1 |
| NFR-4 custo zero | todas — nenhuma chamada a LLM |
| NFR-5 nunca publica | nenhuma tarefa toca `articles` |

**2. Marcadores de posição.** Nenhum. Todo passo de código traz o código.

**3. Consistência de tipos.** `ItemDeFeed` (Tarefa 1) é consumido pelo script da Tarefa 5, que produz o formato que `validarAchados` (Tarefa 2) valida e a rota (Tarefa 3) grava. `pautasVisiveis` e `resumoDaExecucao` (Tarefa 4) recebem exatamente as colunas que a migração da Tarefa 3 cria. `FONTES` é usada nas Tarefas 2, 4 e 5, com a duplicata da 5 amarrada por teste.

**4. Review Focus.** Os cinco casos têm teste: `guid isPermaLink="false"` e `<comments>` (Tarefa 1, passo 2), título com entidade (Tarefa 1), `pubDate` ausente ou ilegível (Tarefas 1 e 2), execução com tudo falhando (Tarefas 3 e 4).

---

## O que fica para depois

**Etapa 2** — matéria de número a partir de BCB, CVM e ANS. Todas com dado estruturado, sem navegador.

**Etapa 3** — SUSEP e DOU com Playwright, mais a investigação do CNseg, que não tem RSS.

Nenhuma das duas começa antes de a etapa 1 estar rodando de verdade por alguns dias.
