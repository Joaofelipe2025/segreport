# Redação automática — etapas 1 e 2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a procedência de uma matéria representável no banco, visível
na página e no painel, e construir toda a lógica que decide o que vira
matéria — sem gastar um centavo de modelo.

**Architecture:** Duas camadas independentes. O banco ganha colunas de
procedência e uma `check constraint` que recusa matéria derivada sem fonte;
o portal e o painel passam a mostrar o que essas colunas dizem. Em paralelo,
módulos puros sob `src/lib/redacao/` decidem classificação, agrupamento,
seleção e capa, todos testáveis sem rede e sem modelo. O gerador que os
consome é a etapa 3, com plano próprio.

**Tech Stack:** Next.js 16, TypeScript, Supabase/Postgres, Vitest, PGlite
para os testes de banco.

**Spec:** `docs/superpowers/specs/2026-10-08-redacao-automatica-design.md`

## Global Constraints

- Tudo em português, com acentuação correta: código, comentários, testes e
  texto de tela.
- Os arquivos estão em CRLF. Scripts Node de busca-e-troca falham nisso —
  use a ferramenta Edit. Todo padrão de regex que toque arquivo do projeto
  usa `\r?\n`, nunca `\n` puro.
- **Não rodar `npm run build`** enquanto houver `next dev` de pé. Verificar
  com `npx tsc --noEmit`, `npm run lint`, `npx vitest run` e
  `node supabase/setup/validar.mjs`.
- **Não fazer `git push`** nem abrir PR: operação exclusiva de outro papel
  neste projeto.
- `revoke` de coluna é no-op enquanto o papel tem o privilégio da tabela
  inteira. Toda alteração de privilégio de coluna revoga a tabela primeiro.
  Isso já quebrou este repositório antes.
- Teto de seleção: **dez matérias por execução, alvo cinco**.
- Tamanhos: `release` 180–300 palavras, `apuracao` 300–450.
- Nenhuma matéria nasce publicada.

## Review Focus

1. **Pauta presa por execução morta** — reserva de uma hora que nunca
   expira deixa a pauta fora da fila para sempre (Tarefa 4).
2. **`origem = 'derivada'` sem fonte chegando pela API** — precisa virar 400
   legível, não 500 cru do Postgres (Tarefa 7).
3. **`fonte_original_url` com esquema perigoso** — `javascript:` vira link
   clicável na página pública (Tarefas 1 e 2).
4. **Editoria sem conjunto de capas** — escolher capa não pode lançar nem
   devolver caminho inexistente (Tarefa 6).
5. **Duas pautas do mesmo release com títulos diferentes** — o agrupamento
   é por URL, que difere entre veículos; sem outro critério, o mesmo
   comunicado vira três matérias (Tarefa 4).

---

### Task 1: A procedência no banco

**Files:**
- Create: `supabase/migrations/20261008000001_procedencia.sql`
- Create: `tests/rls/procedencia.test.ts`
- Modify: `supabase/setup/esquema-completo.sql` (anexar ao final)
- Modify: `src/lib/supabase/types.ts` (Row/Insert/Update de `articles`)

**Interfaces:**
- Produces: colunas `origem`, `fonte_original_url`, `fonte_original_nome`,
  `precisa_checagem` em `articles`; estado `em_producao` em `pautas`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/rls/procedencia.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { actAsOwner, closeDb, tryWrite, withRollback } from "../helpers/db";

afterAll(closeDb);

const INSERE = (extra: string) => `
  insert into public.articles (slug, title, status ${extra ? "," + extra.split("=")[0] : ""})
  values ('p-${Math.random().toString(36).slice(2, 8)}', 'Uma matéria', 'draft'
          ${extra ? ", " + extra.split("=").slice(1).join("=") : ""})`;

describe("procedência da matéria", () => {
  it("derivada SEM fonte é recusada pelo banco", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, origem)
         values ('d1', 'Derivada sem fonte', 'draft', 'derivada')`
      );
      expect(t.ok).toBe(false);
      expect(t.error).toMatch(/derivada_tem_fonte/);
    });
  });

  it("derivada COM fonte entra", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, origem, fonte_original_url)
         values ('d2', 'Derivada com fonte', 'draft', 'derivada', 'https://cqcs.com.br/n/1')`
      );
      expect(t.ok).toBe(true);
    });
  });

  it("origem inventada é recusada", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status, origem)
         values ('d3', 'Origem torta', 'draft', 'copiada')`
      );
      expect(t.ok).toBe(false);
    });
  });

  it("release e primaria não exigem fonte", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      for (const o of ["release", "primaria"]) {
        const t = await tryWrite(
          db,
          `insert into public.articles (slug, title, status, origem)
           values ('${o}-1', 'Matéria', 'draft', '${o}')`
        );
        expect(t.ok, o).toBe(true);
      }
    });
  });

  it("matéria escrita à mão continua entrando sem origem", async () => {
    // O caminho manual não muda. Se esta falhar, quebramos o CMS.
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.articles (slug, title, status)
         values ('manual-1', 'Escrita por uma pessoa', 'draft')`
      );
      expect(t.ok).toBe(true);
    });
  });

  it("precisa_checagem NÃO é legível pelo público", async () => {
    // Dizer ao leitor que uma matéria publicada não foi checada é pior do
    // que não publicá-la. É informação de redação.
    await withRollback(async (db) => {
      const t = await tryWrite(
        db,
        `set role anon; select precisa_checagem from public.articles limit 1`
      );
      expect(t.ok).toBe(false);
    });
  });

  it("o crédito É legível pelo público", async () => {
    await withRollback(async (db) => {
      const t = await tryWrite(
        db,
        `set role anon; select fonte_original_url, fonte_original_nome, origem
           from public.articles limit 1`
      );
      expect(t.ok).toBe(true);
    });
  });

  it("pautas aceita o estado em_producao", async () => {
    await withRollback(async (db) => {
      await actAsOwner(db);
      const t = await tryWrite(
        db,
        `insert into public.pautas (fonte, tipo_de_fonte, titulo, url, estado)
         values ('cqcs', 'imprensa', 'T', 'https://x.test/1', 'em_producao')`
      );
      expect(t.ok).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run tests/rls/procedencia.test.ts`
Expected: FAIL — `column "origem" of relation "articles" does not exist`

- [ ] **Step 3: Escrever a migração**

Criar `supabase/migrations/20261008000001_procedencia.sql`:

```sql
-- ============================================================================
-- Procedência da matéria
--
-- O dono do veículo disse, duas vezes: "não quero plágio, apenas inspiração".
-- Esta migração é onde essa frase deixa de ser instrução de prompt e vira
-- invariante de banco. Um modelo esquece numa manhã ruim; uma check
-- constraint não esquece.
-- ============================================================================

alter table public.articles
  add column if not exists origem              text,
  add column if not exists fonte_original_url  text,
  add column if not exists fonte_original_nome text,
  add column if not exists precisa_checagem    boolean not null default false;

-- `origem is null` é o caminho manual: matéria escrita por uma pessoa.
-- Precisa continuar passando, senão quebramos o CMS inteiro.
alter table public.articles drop constraint if exists articles_origem_valida;
alter table public.articles
  add constraint articles_origem_valida
    check (origem is null or origem in ('release', 'primaria', 'derivada'));

-- O ponto que carrega a regra do dono.
alter table public.articles drop constraint if exists articles_derivada_tem_fonte;
alter table public.articles
  add constraint articles_derivada_tem_fonte
    check (origem <> 'derivada' or fonte_original_url is not null);

-- Endereço de origem precisa ser endereço. Sem isto, `javascript:...` vira
-- link clicável na página pública, porque o crédito é renderizado como <a>.
alter table public.articles drop constraint if exists articles_fonte_eh_http;
alter table public.articles
  add constraint articles_fonte_eh_http
    check (fonte_original_url is null or fonte_original_url ~* '^https?://');

-- Estado de reserva da pauta. A coluna tem check desde o vigia, então o
-- valor novo precisa entrar nela.
alter table public.pautas drop constraint if exists pautas_estado_check;
alter table public.pautas
  add constraint pautas_estado_check
    check (estado in ('nova', 'em_producao', 'lida', 'descartada', 'virou_materia'));

-- Privilégio de coluna: o crédito é público, a marca de checagem não.
--
-- O revoke da TABELA vem primeiro. Privilégio de coluna é ignorado enquanto
-- o papel tem o da tabela inteira — isso já mordeu este repositório.
revoke select on public.articles from anon, authenticated;
grant select (
  id, slug, title, subtitle, excerpt, cover_url, category_id, author_id,
  status, is_premium, is_exclusive, reading_time, view_count, published_at,
  created_at, updated_at, standfirst, scheduled_for, seo_title,
  seo_description, updated_by,
  origem, fonte_original_url, fonte_original_nome
) on public.articles to anon, authenticated;
```

- [ ] **Step 4: Anexar ao esquema completo e validar**

```bash
printf '\n-- ▼▼▼ 20261008000001_procedencia.sql ▼▼▼\n\n' >> supabase/setup/esquema-completo.sql
cat supabase/migrations/20261008000001_procedencia.sql >> supabase/setup/esquema-completo.sql
node supabase/setup/validar.mjs
```

Expected: `✓ Aplica num banco limpo`, 16 tabelas.

- [ ] **Step 5: Rodar os testes**

Run: `npx vitest run tests/rls/procedencia.test.ts`
Expected: PASS, 8 testes.

- [ ] **Step 6: Declarar as colunas em types.ts**

Em `src/lib/supabase/types.ts`, dentro de `articles`, acrescentar ao `Row`:

```ts
          origem: "release" | "primaria" | "derivada" | null;
          fonte_original_url: string | null;
          fonte_original_nome: string | null;
          precisa_checagem: boolean;
```

Ao `Insert` e ao `Update`, as mesmas quatro com `?`:

```ts
          origem?: "release" | "primaria" | "derivada" | null;
          fonte_original_url?: string | null;
          fonte_original_nome?: string | null;
          precisa_checagem?: boolean;
```

Em `pautas`, trocar o tipo de `estado` no `Row` e no `Update` para incluir o
estado novo, se ele estiver tipado como união literal; se estiver como
`string`, nada a fazer.

- [ ] **Step 7: Verificar e commitar**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
git add -A && git commit -m "feat(redacao): procedência da matéria no banco

Matéria derivada sem endereço de origem é recusada pelo Postgres. É onde
'inspiração, não plágio' deixa de depender da boa vontade do gerador."
```

---

### Task 2: O crédito na página pública

**Files:**
- Modify: `src/lib/types.ts` (interface `Article`)
- Modify: `src/lib/data/articles-db.ts:30-63` (`LinhaDeMateria` e `paraArticle`)
- Modify: `src/app/(portal)/noticias/[slug]/page.tsx`
- Create: `tests/portal/credito.test.ts`

**Interfaces:**
- Consumes: colunas da Tarefa 1.
- Produces: `Article.fonteUrl?: string`, `Article.fonteNome?: string`;
  `creditoDaFonte(a: { fonteUrl?: string; fonteNome?: string }): string | null`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/portal/credito.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { creditoDaFonte } from "@/lib/portal/credito";

describe("o crédito ao veículo de origem", () => {
  it("sem fonte, não há crédito", () => {
    expect(creditoDaFonte({})).toBeNull();
  });

  it("com nome e endereço, usa o nome", () => {
    expect(
      creditoDaFonte({ fonteUrl: "https://cqcs.com.br/n/1", fonteNome: "CQCS" })
    ).toBe("CQCS");
  });

  it("sem nome, usa o domínio — nunca o endereço inteiro", () => {
    // Despejar a URL completa no rodapé é feio e vaza parâmetros de
    // rastreio que vieram no feed.
    expect(creditoDaFonte({ fonteUrl: "https://www.cqcs.com.br/n/1?utm=x" })).toBe(
      "cqcs.com.br"
    );
  });

  it("endereço ilegível não derruba a página", () => {
    expect(creditoDaFonte({ fonteUrl: "nem-url" })).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run tests/portal/credito.test.ts`
Expected: FAIL — `Cannot find module '@/lib/portal/credito'`

- [ ] **Step 3: Escrever o módulo**

Criar `src/lib/portal/credito.ts`:

```ts
/**
 * O nome a exibir no crédito ao veículo de origem.
 *
 * Devolve nulo quando não há o que creditar. O `www.` sai e o caminho
 * também: o rodapé mostra de onde veio, não o endereço inteiro com os
 * parâmetros de rastreio que vieram no feed.
 */
export function creditoDaFonte(a: {
  fonteUrl?: string | null;
  fonteNome?: string | null;
}): string | null {
  const nome = a.fonteNome?.trim();
  if (nome) return nome;

  const url = a.fonteUrl?.trim();
  if (!url) return null;

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // Endereço ilegível não pode derrubar a página da matéria.
    return null;
  }
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/portal/credito.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 5: Levar os campos até o componente**

Em `src/lib/types.ts`, dentro de `interface Article`, antes de `featured`:

```ts
  /** Endereço do veículo de origem, quando a matéria derivou de cobertura alheia. */
  fonteUrl?: string;
  /** Nome do veículo de origem. Sem ele, o crédito usa o domínio. */
  fonteNome?: string;
```

Em `src/lib/data/articles-db.ts`, acrescentar a `LinhaDeMateria`:

```ts
  fonte_original_url: string | null;
  fonte_original_nome: string | null;
```

e, dentro de `paraArticle`, antes de `minTier`:

```ts
    fonteUrl: linha.fonte_original_url ?? undefined,
    fonteNome: linha.fonte_original_nome ?? undefined,
```

No mesmo arquivo, acrescentar `fonte_original_url, fonte_original_nome` à
lista de colunas de **todos** os `.select(...)` que alimentam `paraArticle`.

- [ ] **Step 6: Desenhar o crédito na página**

Em `src/app/(portal)/noticias/[slug]/page.tsx`, no topo:

```ts
import { creditoDaFonte } from "@/lib/portal/credito";
```

Logo após o fechamento do corpo da matéria — depois do `<BlockRenderer>` ou
equivalente, antes do rodapé do artigo — inserir:

```tsx
{(() => {
  const credito = creditoDaFonte(article);
  if (!credito || !article.fonteUrl) return null;
  return (
    <p className="mt-8 border-t border-forest-100 pt-4 text-xs text-ink-4">
      Com informações de{" "}
      <a
        href={article.fonteUrl}
        rel="noopener noreferrer nofollow"
        target="_blank"
        className="underline underline-offset-2 hover:text-forest-700"
      >
        {credito}
      </a>
      .
    </p>
  );
})()}
```

`nofollow` de propósito: o crédito é honestidade editorial, não doação de
autoridade de busca ao concorrente.

- [ ] **Step 7: Verificar e commitar**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
git add -A && git commit -m "feat(portal): crédito ao veículo de origem ao final da matéria"
```

---

### Task 3: A marca de checagem no painel

**Files:**
- Modify: `src/lib/painel/panorama.ts` (acrescentar `precisaChecagem`)
- Modify: `src/lib/painel/publicacao.ts` (portão)
- Modify: `src/app/(admin)/admin/materias/page.tsx:41-42` (CAMPOS + selo)
- Modify: `src/app/(admin)/admin/materias/actions.ts` (ação de desmarcar)
- Modify: `tests/painel/panorama.test.ts`
- Modify: `tests/painel/publicacao.test.ts`

**Interfaces:**
- Produces: `precisaChecagem(linha: { precisa_checagem: boolean }): boolean`;
  `pendenciasParaPublicar` passa a receber `precisa_checagem: boolean`;
  Server Action `confirmarChecagem(id: string)`.

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar a `tests/painel/publicacao.test.ts`:

```ts
describe("matéria que precisa de checagem", () => {
  const completa = {
    title: "Uma matéria com título",
    category_id: 1,
    slug: "uma-materia-com-titulo",
    corpo: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(400) }] }] } as never,
    precisa_checagem: false,
  };

  it("sem a marca, publica", () => {
    expect(pendenciasParaPublicar(completa)).toEqual([]);
  });

  it("com a marca, NÃO publica", () => {
    // A marca só protege se fizer parar. Numa manhã corrida, cinco matérias
    // marcadas e um botão de aprovar viram cinco aprovações.
    const p = pendenciasParaPublicar({ ...completa, precisa_checagem: true });
    expect(p).toHaveLength(1);
    expect(p[0]).toMatch(/checagem/i);
  });

  it("a pendência diz o que fazer, não só o que falta", () => {
    const [aviso] = pendenciasParaPublicar({ ...completa, precisa_checagem: true });
    expect(aviso).toMatch(/confirme|conferi/i);
  });
});
```

Acrescentar a `tests/painel/panorama.test.ts`:

```ts
describe("a marca de checagem na fila", () => {
  it("marcada é marcada", () => {
    expect(precisaChecagem({ precisa_checagem: true })).toBe(true);
  });

  it("não marcada não é", () => {
    expect(precisaChecagem({ precisa_checagem: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run tests/painel/`
Expected: FAIL — `precisaChecagem is not a function` e a pendência não aparece.

- [ ] **Step 3: Implementar**

Em `src/lib/painel/panorama.ts`, ao final:

```ts
/**
 * A matéria foi escrita a partir de cobertura de terceiro sem que a fonte
 * primária fosse encontrada.
 *
 * Diferente de `ninguemRevisou`, que é sinal de FILA e se apaga no primeiro
 * salvamento: esta é afirmação sobre a apuração, e só sai por ato humano
 * explícito de quem conferiu.
 */
export function precisaChecagem(linha: { precisa_checagem: boolean }): boolean {
  return linha.precisa_checagem === true;
}
```

Em `src/lib/painel/publicacao.ts`, acrescentar ao `MateriaParaPublicar`:

```ts
  precisa_checagem: boolean;
```

e, dentro de `pendenciasParaPublicar`, antes do `return faltas`:

```ts
  // Não é conveniência de interface como as demais: é a única barreira entre
  // texto derivado e o leitor. Sai por ato humano, no editor.
  if (materia.precisa_checagem) {
    faltas.push(
      "confirme a checagem — esta matéria saiu de cobertura de terceiro e a fonte primária não foi encontrada"
    );
  }
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/painel/`
Expected: PASS.

- [ ] **Step 5: Mostrar na lista do painel**

Acrescentar `precisa_checagem` ao fim da string `CAMPOS` em **dois** lugares:
`src/app/(admin)/admin/materias/page.tsx:41-42` e a consulta equivalente de
`src/app/(admin)/admin/page.tsx`, que alimenta a fila de revisão. A segunda é
a que desenha o selo; esquecê-la faz o selo nunca aparecer.


O selo que já existe para `ninguemRevisou` está em
`src/app/(admin)/admin/page.tsx:195`, dentro da fila de revisão do painel
inicial. Acrescentar **ao lado dele**, no mesmo bloco:

```tsx
{precisaChecagem(m) && (
  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
    Precisa checagem
  </span>
)}
```

com `import { precisaChecagem } from "@/lib/painel/panorama";` no topo.

Acrescentar `precisa_checagem: boolean;` à interface `LinhaDoPanorama` em
`src/lib/painel/panorama.ts`.

- [ ] **Step 6: A ação de confirmar a checagem**

Em `src/app/(admin)/admin/materias/actions.ts`, ao final:

```ts
/**
 * Quem clica aqui assume a checagem.
 *
 * Só admin: confirmar apuração é decisão editorial, e colunista não publica.
 */
export async function confirmarChecagem(id: string): Promise<EstadoMateria> {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .update({ precisa_checagem: false })
    .eq("id", id)
    .select("id");

  if (error) {
    return { status: "erro", mensagem: `Não foi possível confirmar: ${error.message}` };
  }
  if (!data || data.length === 0) {
    // A RLS recusou em silêncio, ou a matéria não existe. Dizer "salvo"
    // aqui seria mentir para quem está prestes a publicar.
    return { status: "erro", mensagem: "A matéria não foi encontrada ou você não pode alterá-la." };
  }

  revalidatePath("/admin/materias");
  revalidatePath(`/admin/materias/${id}`);
  return { status: "salvo", mensagem: "Checagem confirmada." };
}
```

No editor (`src/app/(admin)/admin/materias/[id]/EditorDeMateria.tsx`), quando
`precisa_checagem` for verdadeiro, desenhar um aviso acima do corpo com um
botão que chama `confirmarChecagem`, usando o mesmo padrão de `useTransition`
já empregado nas outras ações do arquivo. Texto do aviso:

> Esta matéria saiu de cobertura de terceiro e a fonte primária não foi
> encontrada. Confira as afirmações antes de publicar.

Botão: **Confirmei a checagem**.

- [ ] **Step 7: Verificar e commitar**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
git add -A && git commit -m "feat(painel): marca de checagem visível e barrando a publicação"
```

---

### Task 4: Classificação e agrupamento

**Files:**
- Create: `src/lib/redacao/pauta.ts`
- Create: `src/lib/redacao/agrupamento.ts`
- Create: `tests/redacao/agrupamento.test.ts`

**Interfaces:**
- Produces:
  - `interface PautaBruta { id: string; fonte: string; tipoDeFonte: "imprensa" | "primaria"; titulo: string; url: string; resumo: string | null; publicadoEm: string | null; estado: string; criadoEm: string }`
  - `type Classe = "release" | "apuracao"`
  - `interface Grupo { pautas: PautaBruta[]; principal: PautaBruta }`
  - `agrupar(pautas: PautaBruta[]): Grupo[]`
  - `reservaExpirada(estado: string, atualizadoEm: string, agora: Date): boolean`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/redacao/agrupamento.test.ts`:

```ts
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

  it("estado que não é reserva nunca expira", () => {
    expect(reservaExpirada("nova", atras(500), AGORA)).toBe(false);
    expect(reservaExpirada("virou_materia", atras(500), AGORA)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run tests/redacao/`
Expected: FAIL — `Cannot find module '@/lib/redacao/agrupamento'`

- [ ] **Step 3: Escrever os módulos**

Criar `src/lib/redacao/pauta.ts`:

```ts
/** Uma pauta como ela sai do banco, com os nomes em português do domínio. */
export interface PautaBruta {
  id: string;
  fonte: string;
  tipoDeFonte: "imprensa" | "primaria";
  titulo: string;
  url: string;
  resumo: string | null;
  publicadoEm: string | null;
  estado: string;
  criadoEm: string;
}

/**
 * O que a pauta é, e portanto como será tratada.
 *
 * `release` não tem dono: o comunicado veio do próprio interessado e todos
 * os veículos receberam igual, então não há a quem creditar. `apuracao` tem
 * dono, e é por isso que precisa de crédito quando a fonte primária não for
 * encontrada.
 */
export type Classe = "release" | "apuracao";
```

Criar `src/lib/redacao/agrupamento.ts`:

```ts
import type { PautaBruta } from "./pauta";

/** Quanto tempo uma pauta pode ficar reservada antes de voltar para a fila. */
const RESERVA_MINUTOS = 60;

export interface Grupo {
  pautas: PautaBruta[];
  /** A que publicou primeiro. É dela que saem título e endereço de origem. */
  principal: PautaBruta;
}

/**
 * Reduz o título ao seu esqueleto, para comparar fatos e não redações.
 *
 * Acento, caixa, pontuação e palavra de ligação saem. "Seguradora X anuncia
 * aquisição da Y" e "Seguradora X anuncia a aquisição da Y" viram a mesma
 * coisa — que é o que elas são.
 */
const LIGACAO = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na",
  "nos", "nas", "um", "uma", "para", "por", "com", "que", "ao", "aos",
]);

function esqueleto(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 0 && !LIGACAO.has(p))
    .sort()
    .join(" ");
}

/**
 * Junta pautas que reproduzem o mesmo comunicado.
 *
 * A chave é o esqueleto do título, NÃO a URL: veículos diferentes publicam o
 * mesmo release em endereços diferentes, e agrupar por URL não agruparia
 * nada. Era a lacuna óbvia.
 */
export function agrupar(pautas: PautaBruta[]): Grupo[] {
  const porEsqueleto = new Map<string, PautaBruta[]>();

  for (const p of pautas) {
    const chave = esqueleto(p.titulo);
    const lista = porEsqueleto.get(chave);
    if (lista) lista.push(p);
    else porEsqueleto.set(chave, [p]);
  }

  return [...porEsqueleto.values()].map((lista) => ({
    pautas: lista,
    principal: maisAntiga(lista),
  }));
}

/** A que publicou primeiro. Sem data, a primeira da lista — e nunca indefinida. */
function maisAntiga(lista: PautaBruta[]): PautaBruta {
  return lista.reduce((melhor, atual) => {
    if (!atual.publicadoEm) return melhor;
    if (!melhor.publicadoEm) return atual;
    return atual.publicadoEm < melhor.publicadoEm ? atual : melhor;
  }, lista[0]);
}

/**
 * A reserva morreu?
 *
 * Uma execução interrompida deixa a pauta em `em_producao` para sempre, e
 * ela some da fila sem nunca virar matéria. A expiração devolve a pauta.
 */
export function reservaExpirada(
  estado: string,
  atualizadoEm: string,
  agora: Date
): boolean {
  if (estado !== "em_producao") return false;
  const idade = agora.getTime() - new Date(atualizadoEm).getTime();
  return idade > RESERVA_MINUTOS * 60_000;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/redacao/`
Expected: PASS, 9 testes.

- [ ] **Step 5: Commitar**

```bash
npx tsc --noEmit && npm run lint
git add -A && git commit -m "feat(redacao): agrupar reproduções do mesmo comunicado

A chave é o esqueleto do título, não a URL: veículos diferentes publicam o
mesmo release em endereços diferentes, e agrupar por URL não agruparia nada."
```

---

### Task 5: A tabela de decisão da procedência

**Files:**
- Create: `src/lib/redacao/rota.ts`
- Create: `tests/redacao/rota.test.ts`

**Interfaces:**
- Consumes: `Classe` da Tarefa 4.
- Produces: `rotaDaMateria(classe: Classe, achouFontePrimaria: boolean): Rota`
  onde `interface Rota { origem: "release" | "primaria" | "derivada"; precisaCredito: boolean; precisaChecagem: boolean; palavras: [number, number] }`.

Esta é a tabela que carrega a regra do dono. Tudo o mais no subsistema é
encanamento; é aqui que se decide se uma matéria credita a origem.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/redacao/rota.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { rotaDaMateria } from "@/lib/redacao/rota";

describe("a tabela de decisão da procedência", () => {
  it("release não credita ninguém", () => {
    // O comunicado veio do próprio interessado e todos os veículos
    // receberam igual. Creditar o primeiro a publicar seria inventar um
    // dono que o fato não tem.
    const r = rotaDaMateria("release", false);
    expect(r.origem).toBe("release");
    expect(r.precisaCredito).toBe(false);
    expect(r.precisaChecagem).toBe(false);
  });

  it("apuração COM fonte primária é matéria própria", () => {
    const r = rotaDaMateria("apuracao", true);
    expect(r.origem).toBe("primaria");
    expect(r.precisaCredito).toBe(false);
    expect(r.precisaChecagem).toBe(false);
  });

  it("apuração SEM fonte primária credita e nasce marcada", () => {
    // É o único caminho que produz texto derivado. Os dois sinais andam
    // juntos de propósito: um protege quem apurou, o outro protege o leitor.
    const r = rotaDaMateria("apuracao", false);
    expect(r.origem).toBe("derivada");
    expect(r.precisaCredito).toBe(true);
    expect(r.precisaChecagem).toBe(true);
  });

  it("só derivada exige crédito — em nenhum outro caminho", () => {
    const casos: Array<[Parameters<typeof rotaDaMateria>[0], boolean]> = [
      ["release", true],
      ["release", false],
      ["apuracao", true],
    ];
    for (const [classe, achou] of casos) {
      expect(rotaDaMateria(classe, achou).precisaCredito, `${classe}/${achou}`).toBe(false);
    }
  });

  it("crédito e marca de checagem são sempre a mesma resposta", () => {
    // Se um dia divergirem, uma matéria derivada pode sair creditada mas
    // sem marca — publicável sem ninguém conferir. Este teste trava isso.
    for (const classe of ["release", "apuracao"] as const) {
      for (const achou of [true, false]) {
        const r = rotaDaMateria(classe, achou);
        expect(r.precisaCredito, `${classe}/${achou}`).toBe(r.precisaChecagem);
      }
    }
  });

  it("release é curto, apuração é um pouco maior", () => {
    expect(rotaDaMateria("release", false).palavras).toEqual([180, 300]);
    expect(rotaDaMateria("apuracao", true).palavras).toEqual([300, 450]);
    expect(rotaDaMateria("apuracao", false).palavras).toEqual([300, 450]);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run tests/redacao/rota.test.ts`
Expected: FAIL — `Cannot find module '@/lib/redacao/rota'`

- [ ] **Step 3: Escrever o módulo**

Criar `src/lib/redacao/rota.ts`:

```ts
import type { Classe } from "./pauta";

export interface Rota {
  origem: "release" | "primaria" | "derivada";
  /** Exige citar o veículo de origem ao final do texto. */
  precisaCredito: boolean;
  /** Nasce marcada: ninguém conferiu contra documento. */
  precisaChecagem: boolean;
  /** Mínimo e máximo de palavras. */
  palavras: [number, number];
}

/**
 * O que acontece com a pauta, dado o que ela é e o que se conseguiu apurar.
 *
 * Esta é a tabela que carrega a decisão do dono do veículo, dita duas vezes:
 * "não quero plágio, apenas inspiração". Só um caminho produz texto
 * derivado, e esse caminho obriga crédito.
 *
 * `precisaCredito` e `precisaChecagem` saem sempre juntos, e isso não é
 * coincidência que valha simplificar: se divergissem, uma matéria derivada
 * poderia sair creditada mas sem marca — publicável sem ninguém conferir.
 * Há teste travando a igualdade.
 */
export function rotaDaMateria(classe: Classe, achouFontePrimaria: boolean): Rota {
  if (classe === "release") {
    return {
      origem: "release",
      precisaCredito: false,
      precisaChecagem: false,
      palavras: [180, 300],
    };
  }

  return achouFontePrimaria
    ? { origem: "primaria", precisaCredito: false, precisaChecagem: false, palavras: [300, 450] }
    : { origem: "derivada", precisaCredito: true, precisaChecagem: true, palavras: [300, 450] };
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/redacao/`
Expected: PASS, 6 testes novos.

- [ ] **Step 5: Commitar**

```bash
npx tsc --noEmit && npm run lint
git add -A && git commit -m "feat(redacao): a tabela de decisão da procedência

Só um caminho produz texto derivado, e ele obriga crédito. Crédito e marca
de checagem saem sempre juntos, com teste travando a igualdade."
```

---

### Task 6: Seleção e capa

**Files:**
- Create: `src/lib/redacao/selecao.ts`
- Create: `src/lib/redacao/capa.ts`
- Create: `tests/redacao/selecao.test.ts`

**Interfaces:**
- Consumes: `Grupo` e `PautaBruta` da Tarefa 4.
- Produces: `selecionar(grupos: Grupo[]): Grupo[]`; `TETO_POR_EXECUCAO = 10`;
  `capaDaEditoria(slug: string): string | null`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/redacao/selecao.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { selecionar, TETO_POR_EXECUCAO } from "@/lib/redacao/selecao";
import { capaDaEditoria } from "@/lib/redacao/capa";
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
  ...over,
});

const grupo = (n: number, over: Partial<PautaBruta> = {}): Grupo => {
  const ps = Array.from({ length: n }, () => pauta(over));
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
    const EDITORIAS = [
      "mercado", "tecnologia", "politica", "regulacao", "saude",
      "auto", "vida", "agronegocio", "cyber", "beneficios", "resseguros",
    ];
    for (const e of EDITORIAS) {
      expect(capaDaEditoria(e), e).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run tests/redacao/selecao.test.ts`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Escrever `selecao.ts`**

```ts
import type { Grupo } from "./agrupamento";

/**
 * Quantas matérias uma execução pode produzir.
 *
 * Teto no código, não no prompt. Cinco por dia são trinta e cinco por
 * semana; fila de revisão que acumula deixa de ser lida, que é o mesmo modo
 * de falha da tela de pautas.
 */
export const TETO_POR_EXECUCAO = 10;

/**
 * Ordena por relevância e corta no teto.
 *
 * A repercussão é o sinal mais barato e mais honesto que temos sem gastar
 * modelo: um fato que três veículos cobriram importa mais do que um que só
 * um cobriu. O desempate é pela data — notícia velha interessa menos.
 */
export function selecionar(grupos: Grupo[]): Grupo[] {
  return [...grupos]
    .sort((a, b) => {
      const porRepercussao = b.pautas.length - a.pautas.length;
      if (porRepercussao !== 0) return porRepercussao;
      return (b.principal.publicadoEm ?? "").localeCompare(
        a.principal.publicadoEm ?? ""
      );
    })
    .slice(0, TETO_POR_EXECUCAO);
}
```

- [ ] **Step 4: Escrever `capa.ts`**

```ts
/**
 * A capa de cada editoria.
 *
 * Imagem própria do projeto, reaproveitada. Não se gera fotografia por IA:
 * imagem sintética de um fato real é fabricar fotografia documental, que as
 * regras editoriais do veículo proíbem. Também não se usa foto de terceiro.
 *
 * Sem conjunto para a editoria, devolve nulo — a matéria fica sem
 * `cover_url` e o portal cai na imagem gerada pela semente do slug, que já
 * existe. Nenhuma matéria quebra por falta de foto.
 */
const CAPAS = new Map<string, string>([
  ["mercado", "/capas/mercado.jpg"],
  ["tecnologia", "/capas/tecnologia.jpg"],
  ["politica", "/capas/politica.jpg"],
  ["regulacao", "/capas/regulacao.jpg"],
  ["saude", "/capas/saude.jpg"],
  ["auto", "/capas/auto.jpg"],
  ["vida", "/capas/vida.jpg"],
  ["agronegocio", "/capas/agronegocio.jpg"],
  ["cyber", "/capas/cyber.jpg"],
  ["beneficios", "/capas/beneficios.jpg"],
  ["resseguros", "/capas/resseguros.jpg"],
]);

/** `Map` e não objeto: busca literal responderia a `constructor` e `__proto__`. */
export function capaDaEditoria(editoria: string): string | null {
  return CAPAS.get(editoria) ?? null;
}
```

- [ ] **Step 5: Rodar os testes**

Run: `npx vitest run tests/redacao/`
Expected: PASS. O teste "nenhuma editoria fica sem capa" passa porque o
`Map` cobre as onze; os arquivos em `public/capas/` entram na etapa 4 da
spec, e a ausência deles não quebra nada — o `<Image>` do portal já lida
com caminho ausente caindo no gerado.

- [ ] **Step 6: Commitar**

```bash
npx tsc --noEmit && npm run lint
git add -A && git commit -m "feat(redacao): seleção com teto e capa por editoria"
```

---

### Task 7: O contrato de entrada da procedência

**Files:**
- Modify: `src/lib/ingestao/contrato.ts:25-37`
- Modify: `src/app/api/ingestao/materias/route.ts` (gravar os campos novos)
- Modify: `tests/ingestao/contrato.test.ts`
- Modify: `docs/integracao/astra.md` (esquema OpenAPI)

**Interfaces:**
- Consumes: colunas da Tarefa 1.
- Produces: `PedidoDeIngestao` ganha `origem`, `fonteOriginalUrl`,
  `fonteOriginalNome`, `pautaId`.

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar a `tests/ingestao/contrato.test.ts`:

```ts
describe("procedência no contrato de entrada", () => {
  const base = {
    titulo: "Um título que serve",
    categoria: "regulacao",
    corpoMarkdown: "Um parágrafo com texto suficiente para passar.",
  };

  it("pedido sem procedência continua válido — é o caminho manual e o do Astra", () => {
    const r = validarPedido(base);
    expect(r.ok).toBe(true);
    expect(r.ok && r.pedido.origem).toBeNull();
  });

  it("derivada SEM fonte é recusada aqui, com mensagem legível", () => {
    // Se escapar, quem recusa é a check constraint do Postgres, e o agente
    // recebe um 500 cru em vez de saber o que corrigir.
    const r = validarPedido({ ...base, origem: "derivada" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.comoCorrigir).toMatch(/fonteOriginalUrl/);
  });

  it("derivada COM fonte passa", () => {
    const r = validarPedido({
      ...base,
      origem: "derivada",
      fonteOriginalUrl: "https://cqcs.com.br/n/1",
      fonteOriginalNome: "CQCS",
    });
    expect(r.ok).toBe(true);
  });

  it("origem inventada é recusada e diz quais existem", () => {
    const r = validarPedido({ ...base, origem: "copiada" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.comoCorrigir).toMatch(/release/);
  });

  it("endereço de origem precisa ser http", () => {
    const r = validarPedido({
      ...base,
      origem: "derivada",
      fonteOriginalUrl: "javascript:alert(1)",
    });
    expect(r.ok).toBe(false);
  });

  it("release e primaria não exigem fonte", () => {
    for (const o of ["release", "primaria"]) {
      expect(validarPedido({ ...base, origem: o }).ok, o).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run tests/ingestao/`
Expected: FAIL — `origem` não existe no pedido.

- [ ] **Step 3: Estender o contrato**

Em `src/lib/ingestao/contrato.ts`, acrescentar a `PedidoDeIngestao`:

```ts
  origem: "release" | "primaria" | "derivada" | null;
  fonteOriginalUrl: string | null;
  fonteOriginalNome: string | null;
  /** A pauta que originou a matéria, para marcá-la como usada. */
  pautaId: string | null;
```

e, dentro de `validarPedido`, antes de montar o pedido:

```ts
const ORIGENS = new Set(["release", "primaria", "derivada"]);

// ... dentro de validarPedido:
const origemBruta = typeof bruto.origem === "string" ? bruto.origem.trim() : "";
if (origemBruta && !ORIGENS.has(origemBruta)) {
  return {
    ok: false,
    erro: `Origem "${origemBruta}" não existe.`,
    comoCorrigir: "Use uma destas em `origem`: release, primaria, derivada — ou omita o campo.",
  };
}

const fonteUrl =
  typeof bruto.fonteOriginalUrl === "string" ? bruto.fonteOriginalUrl.trim() : "";

if (fonteUrl && !/^https?:\/\//i.test(fonteUrl)) {
  return {
    ok: false,
    erro: "O endereço de origem precisa começar com http:// ou https://.",
    comoCorrigir: "Envie `fonteOriginalUrl` como endereço completo.",
  };
}

// A mesma regra que a check constraint do banco impõe — mas aqui ela devolve
// uma mensagem que o agente consegue ler e corrigir, em vez de um 500 cru.
if (origemBruta === "derivada" && !fonteUrl) {
  return {
    ok: false,
    erro: "Matéria derivada precisa dizer de onde veio.",
    comoCorrigir:
      "Envie `fonteOriginalUrl` com o endereço da cobertura de origem, ou use outra `origem`.",
  };
}
```

No objeto devolvido, acrescentar:

```ts
    origem: (origemBruta || null) as PedidoDeIngestao["origem"],
    fonteOriginalUrl: fonteUrl || null,
    fonteOriginalNome:
      typeof bruto.fonteOriginalNome === "string" && bruto.fonteOriginalNome.trim()
        ? bruto.fonteOriginalNome.trim()
        : null,
    pautaId: typeof bruto.pautaId === "string" && bruto.pautaId.trim() ? bruto.pautaId.trim() : null,
```

- [ ] **Step 4: Gravar na rota**

Em `src/app/api/ingestao/materias/route.ts`, no `.insert({...})` de
`articles`, acrescentar:

```ts
      origem: pedido.origem,
      fonte_original_url: pedido.fonteOriginalUrl,
      fonte_original_nome: pedido.fonteOriginalNome,
      // Derivada nasce marcada: saiu de cobertura de terceiro sem que a
      // fonte primária fosse encontrada, e ninguém conferiu ainda.
      precisa_checagem: pedido.origem === "derivada",
```

Depois do insert bem-sucedido e do registro em `ingestao_recebidas`,
acrescentar a marcação da pauta:

```ts
  // A pauta sai da fila. O erro é registrado e não derruba a resposta: a
  // matéria já existe, e perder a marcação custa uma duplicata que a pessoa
  // vê, enquanto devolver erro aqui faria o chamador reenviar o texto todo.
  if (pedido.pautaId) {
    const { error: erroPauta } = await admin
      .from("pautas")
      .update({ estado: "virou_materia", article_id: criada.id })
      .eq("id", pedido.pautaId);
    if (erroPauta) {
      console.error("[ingestao] pauta não marcada:", erroPauta.message);
    }
  }
```

- [ ] **Step 5: Rodar os testes**

Run: `npx vitest run`
Expected: PASS, suíte inteira verde.

- [ ] **Step 6: Atualizar o esquema do Astra**

Em `docs/integracao/astra.md`, dentro de `properties` do esquema OpenAPI,
acrescentar depois de `seoDescricao`:

```yaml
                origem:
                  type: string
                  description: >
                    De onde veio a matéria. Omita se você mesmo apurou.
                    "derivada" EXIGE fonteOriginalUrl.
                  enum: [release, primaria, derivada]
                fonteOriginalUrl:
                  type: string
                  description: Endereço da cobertura de origem, quando a matéria derivou dela.
                fonteOriginalNome:
                  type: string
                  description: Nome do veículo de origem. Sem ele, o crédito usa o domínio.
```

O teste que amarra o enum de categorias ao código continua passando: ele
procura `enum:` seguido de itens em minúsculas, e o enum novo também casa
esse formato. Rodar `npx vitest run tests/ingestao/` para confirmar.

- [ ] **Step 7: Verificar e commitar**

```bash
npx tsc --noEmit && npm run lint && npx vitest run && node supabase/setup/validar.mjs
git add -A && git commit -m "feat(ingestao): procedência no contrato de entrada

A mesma regra da check constraint, mas aqui com mensagem que o agente
consegue ler e corrigir, em vez de um 500 cru do Postgres."
```

---

## Depois deste plano

As etapas 3 e 4 da spec — o gerador que chama o modelo, a busca de fonte
primária, o script, o agendamento e as imagens de capa — ganham plano
próprio. Nada aqui gasta modelo; tudo aqui é pré-requisito do que gasta.
