# Painel confiável — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o painel do SegReport falhar de forma visível, nunca perder trabalho escrito, e dar à redação uma porta de entrada própria.

**Architecture:** Nenhuma tabela nova. Toda regra testável sai dos componentes React e vai para módulos puros em `src/lib/painel/`, porque a suíte roda em `environment: node` e não tem testing-library — regra dentro de `.tsx` é regra sem teste. As páginas do painel passam a tratar `error` das consultas em vez de descartá-lo, e uma fronteira de erro em `src/app/(admin)/error.tsx` recolhe o que escapar.

**Tech Stack:** Next.js 16.2.9 (App Router, Turbopack), React 19, Tailwind v4, Supabase (Postgres + Auth + RLS), Tiptap 3, Vitest + PGlite.

**Spec:** `docs/superpowers/specs/2026-09-24-painel-confiavel.md`

## Global Constraints

- **Nenhuma tabela nova, nenhuma coluna nova** (NFR-1). Flash, Eventos e Hub são planos separados.
- Nenhum caminho novo lê `content`, `content_json`, `content_text` ou `search_vector` direto da tabela (NFR-3). O corpo sai por `article_body_json` (leitor) ou `article_body_for_edit` (painel).
- Regra de negócio mora em `.ts` sob `src/lib/`, nunca em `.tsx` (NFR-2). `vitest.config.ts` tem `include: ["tests/**/*.test.ts"]` e `environment: "node"`.
- Tipografia Poppins; **negrito só em caso específico**; lime nunca como texto sobre fundo claro (NFR-4).
- Painel inteiro `noindex` e `force-dynamic` (NFR-5).
- Textos de interface em português, com acentuação correta.
- Commits em conventional commits, em português, referenciando o FR quando couber.
- Rodar `npx vitest run`, `npx tsc --noEmit` e `npm run lint` antes de cada commit.
- **Não rodar `npm run build` com o `next dev` no ar** — já derrubou o heap duas vezes nesta máquina.

## Review Focus

Cinco entradas que a spec implica, que nenhuma tarefa exercita por padrão, e que provavelmente machucariam quem usa. Cada uma ganhou teste na tarefa dona do código.

1. **`?motivo=` com valor arbitrário ou ausente na porta da redação.** A URL aceita qualquer coisa; um código desconhecido não pode virar `undefined` na tela nem quebrar a página. → Tarefa 2.
2. **Matéria em que `authors` volta nulo** (autor apagado, ou colunista sem assinatura pública). A listagem e o painel inicial fazem `authors(name)`; sem autor, o nome é nulo e o `.name` estoura. → Tarefa 4.
3. **Corpo com só um parágrafo vazio no portão de publicação.** `{"type":"doc","content":[{"type":"paragraph"}]}` é exatamente o que `criarMateria` grava: precisa contar como vazio, ou toda matéria nova passa no portão. → Tarefa 6.
4. **Título com espaços em volta na confirmação de exclusão.** Quem copia o título da tela traz espaço; recusar por causa disso é hostil, aceitar qualquer coisa é perigoso. → Tarefa 5.
5. **Data futura em `formatRelative`** no painel inicial: matéria agendada tem `scheduled_for` à frente de agora, e a conta dá minuto negativo. → Tarefa 4.

---

## Estrutura de arquivos

**Módulos puros novos** — toda a lógica testável desta fase:

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/painel/estados.ts` | Os cinco estados editoriais, rótulos, cores e o type guard. Hoje duplicado em três `.tsx`. |
| `src/lib/painel/consulta.ts` | `exigir()` — converte resposta de Supabase com `error` em exceção legível, em vez de deixar virar "não existe". |
| `src/lib/painel/motivos.ts` | Códigos de recusa → texto para a porta da redação. |
| `src/lib/painel/publicacao.ts` | `pendenciasParaPublicar()` — o portão. |
| `src/lib/painel/confirmacao.ts` | `confirmacaoConfere()` — exclusão por digitação do título. |
| `src/lib/painel/resumo.ts` | `contarPorEstado()` sobre linhas já carregadas; sem I/O. |

**Telas novas:**

| Arquivo | Responsabilidade |
|---|---|
| `src/app/painel/entrar/page.tsx` | Porta da redação. Fora de `(portal)` e de `(admin)`: usa só o layout raiz, sem cabeçalho do portal e sem `requirePainel()`. |
| `src/app/painel/entrar/actions.ts` | `enviarLinkDaRedacao` — resposta neutra. |
| `src/app/painel/entrar/Formulario.tsx` | Cliente, `useActionState`. |
| `src/app/(admin)/error.tsx` | Fronteira de erro do painel. |
| `src/app/(admin)/admin/ajustes/page.tsx` | Fecha o 404 do menu. |
| `src/app/(admin)/admin/ajustes/actions.ts` | `salvarAssinatura`. |
| `src/app/(admin)/admin/ajustes/FormularioDeAssinatura.tsx` | Cliente. |

**Modificados:**

| Arquivo | O quê |
|---|---|
| `src/lib/auth/session.ts` | Redirecionar para `/painel/entrar`. |
| `src/app/(admin)/admin/page.tsx` | De redirecionamento para painel inicial. |
| `src/app/(admin)/admin/materias/page.tsx` | Usar `estados.ts`, tratar `error`. |
| `src/app/(admin)/admin/materias/[id]/EditorDeMateria.tsx` | Sujo/salvo, transições com pendência, exclusão confirmada. |
| `src/app/(admin)/admin/materias/actions.ts` | Portão de publicação em `mudarEstado`. |
| `src/app/(admin)/admin/colunistas/page.tsx`, `midia/page.tsx` | Tratar `error`. |

---

### Task 1: Estados editoriais e erro que não se esconde

Base das tarefas 3, 4, 5 e 6. Move para um módulo puro o que hoje está copiado em três telas, e dá ao painel a ferramenta para parar de engolir falha de consulta.

**Files:**
- Create: `src/lib/painel/estados.ts`
- Create: `src/lib/painel/consulta.ts`
- Create: `src/app/(admin)/error.tsx`
- Modify: `src/app/(admin)/admin/materias/page.tsx`
- Modify: `src/app/(admin)/admin/colunistas/page.tsx`
- Modify: `src/app/(admin)/admin/midia/page.tsx`
- Test: `tests/painel/estados.test.ts`
- Test: `tests/painel/consulta.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `ESTADOS_EDITORIAIS: readonly ["draft","in_review","scheduled","published","archived"]`
  - `type EstadoEditorial = (typeof ESTADOS_EDITORIAIS)[number]`
  - `estadoValido(valor: unknown): valor is EstadoEditorial`
  - `rotuloDeEstado(estado: string): string`
  - `corDeEstado(estado: string): string`
  - `class FalhaDeConsulta extends Error { readonly detalhe: string }`
  - `exigir<T>(resposta: { data: T | null; error: { message: string } | null }, oQue: string): T`

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/painel/estados.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  ESTADOS_EDITORIAIS,
  corDeEstado,
  estadoValido,
  rotuloDeEstado,
} from "@/lib/painel/estados";

describe("estados editoriais", () => {
  it("são cinco, na ordem do fluxo editorial", () => {
    expect(ESTADOS_EDITORIAIS).toEqual([
      "draft",
      "in_review",
      "scheduled",
      "published",
      "archived",
    ]);
  });

  it("reconhece um estado válido", () => {
    expect(estadoValido("in_review")).toBe(true);
  });

  it("recusa o que vem da URL e não é estado", () => {
    // O filtro chega por ?estado= e aceita qualquer coisa.
    expect(estadoValido("published; drop table")).toBe(false);
    expect(estadoValido("")).toBe(false);
    expect(estadoValido(undefined)).toBe(false);
    expect(estadoValido(null)).toBe(false);
    expect(estadoValido(42)).toBe(false);
  });

  it("dá rótulo em português a todo estado conhecido", () => {
    expect(ESTADOS_EDITORIAIS.map(rotuloDeEstado)).toEqual([
      "Rascunho",
      "Em revisão",
      "Agendada",
      "Publicada",
      "Arquivada",
    ]);
  });

  it("estado desconhecido devolve o próprio valor, não vazio", () => {
    // Melhor mostrar 'limbo' na tela do que um espaço em branco sem pista.
    expect(rotuloDeEstado("limbo")).toBe("limbo");
    expect(corDeEstado("limbo")).not.toBe("");
  });
});
```

Criar `tests/painel/consulta.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FalhaDeConsulta, exigir } from "@/lib/painel/consulta";

describe("exigir", () => {
  it("devolve o dado quando não houve erro", () => {
    expect(exigir({ data: [1, 2], error: null }, "as matérias")).toEqual([1, 2]);
  });

  it("levanta FalhaDeConsulta quando o Supabase devolve erro", () => {
    expect(() =>
      exigir({ data: null, error: { message: "permission denied" } }, "as matérias")
    ).toThrow(FalhaDeConsulta);
  });

  it("a mensagem diz o que falhou, em português, e guarda o detalhe técnico", () => {
    // Foi exatamente isto que faltou no editor: o 42501 existia e ninguém viu.
    try {
      exigir({ data: null, error: { message: "42501: permission denied" } }, "as matérias");
      throw new Error("deveria ter levantado");
    } catch (e) {
      const f = e as FalhaDeConsulta;
      expect(f.message).toContain("as matérias");
      expect(f.detalhe).toBe("42501: permission denied");
    }
  });

  it("dado nulo SEM erro passa — ausência legítima não é falha", () => {
    // `maybeSingle()` de linha inexistente devolve data nulo e error nulo.
    expect(exigir({ data: null, error: null }, "a matéria")).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e verificar que falham**

Run: `npx vitest run tests/painel/`
Expected: FAIL — `Cannot find module '@/lib/painel/estados'`

- [ ] **Step 3: Escrever `src/lib/painel/estados.ts`**

```ts
/**
 * Os estados editoriais, num lugar só.
 *
 * Estavam copiados em `materias/page.tsx`, em `EditorDeMateria.tsx` e na
 * máquina de estados do banco. Três cópias de uma lista é uma divergência
 * esperando acontecer — e a divergência que já aconteceu foi de taxonomia,
 * com o banco em `agro` e o portal em `agronegocio`.
 */

export const ESTADOS_EDITORIAIS = [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "archived",
] as const;

export type EstadoEditorial = (typeof ESTADOS_EDITORIAIS)[number];

const ROTULOS: Record<EstadoEditorial, string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  scheduled: "Agendada",
  published: "Publicada",
  archived: "Arquivada",
};

const CORES: Record<EstadoEditorial, string> = {
  draft: "bg-paper text-ink-3",
  in_review: "bg-[#fbf6e0] text-[#7d6612]",
  scheduled: "bg-[#e6f0fb] text-[#1f5590]",
  published: "bg-[#e7f5ec] text-[#1e6b40]",
  archived: "bg-paper text-ink-4",
};

/** O filtro chega pela URL, que aceita qualquer coisa. Só passa o que é estado. */
export function estadoValido(valor: unknown): valor is EstadoEditorial {
  return (
    typeof valor === "string" && (ESTADOS_EDITORIAIS as readonly string[]).includes(valor)
  );
}

/**
 * Estado desconhecido devolve o próprio valor em vez de string vazia: se um
 * dia o banco ganhar um sexto estado, a tela mostra o nome cru — feio, mas
 * informativo — em vez de um vão em branco sem explicação.
 */
export function rotuloDeEstado(estado: string): string {
  return estadoValido(estado) ? ROTULOS[estado] : estado;
}

export function corDeEstado(estado: string): string {
  return estadoValido(estado) ? CORES[estado] : "bg-paper text-ink-4";
}
```

- [ ] **Step 4: Escrever `src/lib/painel/consulta.ts`**

```ts
/**
 * Falha de consulta deixa de virar "não existe".
 *
 * O padrão `const { data } = await supabase...` descarta o `error`. Quando a
 * consulta do editor passou a receber 42501 por causa das colunas revogadas,
 * `data` veio nulo, o código chamou `notFound()` e o usuário viu um 404 —
 * sem nenhuma pista de que o problema era permissão. A criação de matéria
 * parecia quebrada e não estava.
 *
 * `exigir` só reclama quando há erro de verdade. Linha inexistente continua
 * devolvendo nulo, porque ausência legítima não é falha.
 */

export class FalhaDeConsulta extends Error {
  /** Texto cru do Postgres/PostgREST. O painel é interno: mostramos. */
  readonly detalhe: string;

  constructor(oQue: string, detalhe: string) {
    super(`Não foi possível carregar ${oQue}.`);
    this.name = "FalhaDeConsulta";
    this.detalhe = detalhe;
  }
}

export function exigir<T>(
  resposta: { data: T | null; error: { message: string } | null },
  oQue: string
): T {
  if (resposta.error) throw new FalhaDeConsulta(oQue, resposta.error.message);
  return resposta.data as T;
}
```

- [ ] **Step 5: Rodar os testes e verificar que passam**

Run: `npx vitest run tests/painel/`
Expected: PASS — 9 testes

- [ ] **Step 6: Escrever a fronteira de erro `src/app/(admin)/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Última linha do painel.
 *
 * O texto técnico aparece porque isto é ferramenta interna: quem vê esta tela
 * é a redação, e esconder o erro dela não protege ninguém — só transforma um
 * problema diagnosticável em "o sistema não funciona".
 */
export default function ErroDoPainel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[painel]", error);
  }, [error]);

  const detalhe = (error as Error & { detalhe?: string }).detalhe ?? error.message;

  return (
    <div className="max-w-xl rounded-xl border border-hairline bg-white p-6">
      <h1 className="text-lg font-semibold text-ink">Alguma coisa falhou aqui</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-3">
        {error.message || "Erro inesperado no painel."}
      </p>
      <p className="mt-3 overflow-x-auto rounded-lg bg-paper px-3 py-2 font-mono text-[12px] text-ink-3">
        {detalhe}
        {error.digest ? ` · ${error.digest}` : ""}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-forest-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest-700"
        >
          Tentar de novo
        </button>
        <Link href="/admin/materias" className="text-xs font-medium text-forest-700 hover:underline">
          Voltar para as matérias
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Usar `estados.ts` e `exigir()` em `materias/page.tsx`**

Remover o `type Estado`, os `ROTULO`/`COR` locais e o `estadoValido` local. Importar de `@/lib/painel/estados`. Trocar:

```ts
const { data: materias, error } = await consulta;
```

por:

```ts
const materias = exigir(await consulta, "as matérias");
```

e trocar os usos de `materias ?? []` por `materias`. Ajustar `FILTROS` para reusar os estados:

```ts
const FILTROS: Array<{ valor: "" | EstadoEditorial; rotulo: string }> = [
  { valor: "", rotulo: "Todas" },
  { valor: "in_review", rotulo: "Em revisão" },
  { valor: "draft", rotulo: "Rascunhos" },
  { valor: "scheduled", rotulo: "Agendadas" },
  { valor: "published", rotulo: "Publicadas" },
];
```

- [ ] **Step 8: Usar `exigir()` em `colunistas/page.tsx` e `midia/page.tsx`**

Em cada consulta que hoje faz `const { data: X } = await ...`, trocar por `const X = exigir(await ..., "os colunistas")` / `"a mídia"`.

- [ ] **Step 9: Verificar tudo**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: 114 testes passando, sem erro de tipo, sem erro de lint.

- [ ] **Step 10: Commit**

```bash
git add src/lib/painel/estados.ts src/lib/painel/consulta.ts "src/app/(admin)/error.tsx" "src/app/(admin)/admin/materias/page.tsx" "src/app/(admin)/admin/colunistas/page.tsx" "src/app/(admin)/admin/midia/page.tsx" tests/painel/
git commit -m "feat(painel): erro de consulta deixa de virar 404 silencioso [FR-4]

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: A porta da redação

**Files:**
- Create: `src/lib/painel/motivos.ts`
- Create: `src/app/painel/entrar/page.tsx`
- Create: `src/app/painel/entrar/actions.ts`
- Create: `src/app/painel/entrar/Formulario.tsx`
- Modify: `src/lib/auth/session.ts`
- Test: `tests/painel/motivos.test.ts`

**Interfaces:**
- Consumes: `emailValido` de `@/lib/auth/rules`.
- Produces: `mensagemDeMotivo(motivo: unknown): string | null`; a rota `/painel/entrar`; `EstadoDaPorta { status: "inicial" | "enviado" | "erro"; mensagem?: string }`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/painel/motivos.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mensagemDeMotivo } from "@/lib/painel/motivos";

describe("motivos de recusa na porta da redação", () => {
  it("sessão expirada", () => {
    expect(mensagemDeMotivo("sessao")).toBe("Sua sessão expirou. Entre de novo.");
  });

  it("sem acesso ao painel — sem sugerir que a conta não existe", () => {
    const m = mensagemDeMotivo("permissao");
    expect(m).toBe("Esta porta é da redação. Sua conta não tem acesso ao painel.");
  });

  it("link vencido e link ilegível são mensagens diferentes", () => {
    expect(mensagemDeMotivo("link-expirado")).toBe("O link venceu. Peça outro abaixo.");
    expect(mensagemDeMotivo("link-invalido")).toBe(
      "O link não pôde ser lido. Peça outro abaixo."
    );
  });

  it("sem motivo devolve nulo — a tela não mostra aviso nenhum", () => {
    expect(mensagemDeMotivo(undefined)).toBeNull();
    expect(mensagemDeMotivo(null)).toBeNull();
    expect(mensagemDeMotivo("")).toBeNull();
  });

  it("motivo desconhecido devolve nulo, não o código cru", () => {
    // A URL é pública e aceita qualquer coisa. Ecoar o valor na tela seria
    // deixar um estranho escrever no nosso aviso.
    expect(mensagemDeMotivo("<script>alert(1)</script>")).toBeNull();
    expect(mensagemDeMotivo("qualquer-coisa")).toBeNull();
    expect(mensagemDeMotivo(42)).toBeNull();
    expect(mensagemDeMotivo(["sessao"])).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run tests/painel/motivos.test.ts`
Expected: FAIL — `Cannot find module '@/lib/painel/motivos'`

- [ ] **Step 3: Escrever `src/lib/painel/motivos.ts`**

```ts
/**
 * Por que a porta recusou.
 *
 * Lista fechada de propósito: o código vem de `?motivo=` na URL, que qualquer
 * pessoa escreve. Ecoar o valor recebido seria deixar um estranho redigir o
 * aviso que a redação lê.
 */

const MENSAGENS: Record<string, string> = {
  sessao: "Sua sessão expirou. Entre de novo.",
  permissao: "Esta porta é da redação. Sua conta não tem acesso ao painel.",
  "link-expirado": "O link venceu. Peça outro abaixo.",
  "link-invalido": "O link não pôde ser lido. Peça outro abaixo.",
};

export function mensagemDeMotivo(motivo: unknown): string | null {
  if (typeof motivo !== "string") return null;
  return MENSAGENS[motivo] ?? null;
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run tests/painel/motivos.test.ts`
Expected: PASS — 5 testes

- [ ] **Step 5: Escrever `src/app/painel/entrar/actions.ts`**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { emailValido } from "@/lib/auth/rules";

export interface EstadoDaPorta {
  status: "inicial" | "enviado" | "erro";
  mensagem?: string;
}

/**
 * Mesma resposta no sucesso e na falha — a porta da redação é justamente
 * onde essa disciplina mais importa. Dizer "este e-mail não é da redação"
 * entregaria a lista de quem escreve no veículo a quem sondasse endereços.
 */
const RESPOSTA_NEUTRA: EstadoDaPorta = {
  status: "enviado",
  mensagem: "Se este e-mail for da redação, o link chegará em instantes.",
};

export async function enviarLinkDaRedacao(
  _estado: EstadoDaPorta,
  dados: FormData
): Promise<EstadoDaPorta> {
  const email = String(dados.get("email") ?? "").trim().toLowerCase();

  if (!emailValido(email)) {
    return { status: "erro", mensagem: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origem}/auth/confirm`,
      // Convite é o único caminho de entrada. Sem isto, pedir um link cria
      // conta, e a porta da redação passa a ser porta aberta.
      shouldCreateUser: false,
    },
  });

  return RESPOSTA_NEUTRA;
}
```

- [ ] **Step 6: Escrever `src/app/painel/entrar/Formulario.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { enviarLinkDaRedacao, type EstadoDaPorta } from "./actions";

const INICIAL: EstadoDaPorta = { status: "inicial" };

export default function Formulario() {
  const [estado, acao, pendente] = useActionState(enviarLinkDaRedacao, INICIAL);

  return (
    <form action={acao} className="mt-8">
      <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-forest-300">
        E-mail da redação
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        autoFocus
        placeholder="voce@segreport.com.br"
        className="mt-2 w-full rounded-lg border border-forest-600 bg-forest-800 px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-forest-400 focus:border-lime-400"
      />

      <button
        type="submit"
        disabled={pendente}
        className="mt-4 w-full rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-forest-900 transition-colors hover:bg-lime-500 disabled:opacity-60"
      >
        {pendente ? "Enviando…" : "Receber link de acesso"}
      </button>

      {estado.status === "enviado" && (
        <p role="status" className="mt-4 rounded-lg bg-forest-800 px-4 py-3 text-[13px] leading-relaxed text-forest-200">
          {estado.mensagem}
        </p>
      )}
      {estado.status === "erro" && (
        <p role="alert" className="mt-4 text-[13px] text-[#ff9b8a]">
          {estado.mensagem}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 7: Escrever `src/app/painel/entrar/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { mensagemDeMotivo } from "@/lib/painel/motivos";
import Formulario from "./Formulario";

export const metadata: Metadata = {
  title: "Entrar — Redação SegReport",
  robots: { index: false, follow: false },
};

/**
 * Porta da redação.
 *
 * Fica fora de `(portal)` e de `(admin)` de propósito: nada de cabeçalho,
 * rodapé ou chamada de assinatura, e nenhum `requirePainel()` que criaria
 * laço de redirecionamento. Fundo escuro porque isto é ferramenta de
 * trabalho, não publicação — quem chega aqui já sabe o que veio fazer.
 */
export default async function EntrarNaRedacao(props: PageProps<"/painel/entrar">) {
  const params = await props.searchParams;
  const aviso = mensagemDeMotivo(params.motivo);

  return (
    <main className="flex min-h-screen items-center justify-center bg-forest-900 px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lime-400">
          SegReport
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.02em] text-white">
          Redação
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-forest-300">
          Acesso ao painel editorial. O link chega por e-mail e vale uma vez.
        </p>

        {aviso && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-forest-600 bg-forest-800 px-4 py-3 text-[13px] leading-relaxed text-forest-200"
          >
            {aviso}
          </p>
        )}

        <Formulario />

        <p className="mt-8 border-t border-forest-700 pt-5 text-[12px] leading-relaxed text-forest-400">
          Procurando o Hub ou sua assinatura?{" "}
          <Link href="/login" className="text-forest-200 underline underline-offset-2">
            Entrar como leitor
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Redirecionar o painel para a porta certa**

Em `src/lib/auth/session.ts`, trocar os três `/login?motivo=` por `/painel/entrar?motivo=`:

```ts
export async function requireRole(roles: Role[]): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/painel/entrar?motivo=sessao");
  if (!roles.includes(profile.role)) redirect("/painel/entrar?motivo=permissao");
  return profile;
}

/** Atalho para as rotas do painel. */
export async function requirePainel(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/painel/entrar?motivo=sessao");
  if (!podeAcessarPainel(profile.role)) redirect("/painel/entrar?motivo=permissao");
  return profile;
}
```

- [ ] **Step 9: Verificar tudo**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: 119 testes passando, limpo.

Verificar a tela no navegador: `http://localhost:3000/painel/entrar?motivo=permissao` mostra o aviso; `?motivo=inventado` não mostra aviso nenhum e não quebra.

- [ ] **Step 10: Commit**

```bash
git add src/lib/painel/motivos.ts src/app/painel/ src/lib/auth/session.ts tests/painel/motivos.test.ts
git commit -m "feat(painel): porta de entrada própria da redação em /painel/entrar [FR-1]

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Ajustes — fechar o 404 do menu

**Files:**
- Create: `src/app/(admin)/admin/ajustes/page.tsx`
- Create: `src/app/(admin)/admin/ajustes/actions.ts`
- Create: `src/app/(admin)/admin/ajustes/FormularioDeAssinatura.tsx`
- Test: nenhum novo módulo puro; a validação reusa `slugDeNome` de `@/lib/auth/rules`, já testada.

**Interfaces:**
- Consumes: `exigir` (Tarefa 1), `requirePainel`, `slugDeNome`, `rotuloDeEstado` (Tarefa 1).
- Produces: rota `/admin/ajustes`; `salvarAssinatura(estado, dados): Promise<EstadoAjustes>`.

- [ ] **Step 1: Escrever `src/app/(admin)/admin/ajustes/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePainel } from "@/lib/auth/session";
import { slugDeNome } from "@/lib/auth/rules";

export interface EstadoAjustes {
  status: "inicial" | "salvo" | "erro";
  mensagem?: string;
}

/**
 * Edita a própria assinatura pública.
 *
 * Só a própria: o `eq("profile_id", perfil.id)` limita no código e a RLS
 * limita de novo no banco. Um admin que precise mexer na assinatura de outra
 * pessoa usa a tela de colunistas.
 */
export async function salvarAssinatura(
  _estado: EstadoAjustes,
  dados: FormData
): Promise<EstadoAjustes> {
  const perfil = await requirePainel();

  const nome = String(dados.get("name") ?? "").trim();
  const bio = String(dados.get("bio") ?? "").trim();

  if (nome.length < 2) {
    return { status: "erro", mensagem: "O nome da assinatura precisa de pelo menos duas letras." };
  }
  if (!perfil.authorId) {
    return {
      status: "erro",
      mensagem: "Sua conta ainda não tem assinatura pública. Peça ao administrador para criar.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("authors")
    .update({ name: nome, bio: bio || null, slug: slugDeNome(nome) })
    .eq("id", perfil.authorId)
    .eq("profile_id", perfil.id);

  if (error) return { status: "erro", mensagem: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/admin/ajustes");
  return { status: "salvo", mensagem: "Assinatura atualizada." };
}
```

- [ ] **Step 2: Escrever `src/app/(admin)/admin/ajustes/FormularioDeAssinatura.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { salvarAssinatura, type EstadoAjustes } from "./actions";

const INICIAL: EstadoAjustes = { status: "inicial" };

export default function FormularioDeAssinatura({
  nome,
  bio,
}: {
  nome: string;
  bio: string;
}) {
  const [estado, acao, pendente] = useActionState(salvarAssinatura, INICIAL);

  return (
    <form action={acao} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
          Nome da assinatura
        </label>
        <input
          id="name"
          name="name"
          defaultValue={nome}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
        />
        <p className="mt-1.5 text-[11px] text-ink-4">
          É o que aparece assinando a matéria. O endereço da página do autor
          é recalculado a partir dele.
        </p>
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
          Minibiografia
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={bio}
          rows={3}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-forest-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
        >
          {pendente ? "Salvando…" : "Salvar assinatura"}
        </button>
        {estado.status === "salvo" && <span className="text-xs text-forest-700">{estado.mensagem}</span>}
        {estado.status === "erro" && (
          <span role="alert" className="text-xs text-down">
            {estado.mensagem}
          </span>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Escrever `src/app/(admin)/admin/ajustes/page.tsx`**

```tsx
import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { exigir } from "@/lib/painel/consulta";
import { ESTADOS_EDITORIAIS, rotuloDeEstado } from "@/lib/painel/estados";
import FormularioDeAssinatura from "./FormularioDeAssinatura";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const perfil = await requirePainel();
  const supabase = await createClient();

  const autor = perfil.authorId
    ? exigir(
        await supabase
          .from("authors")
          .select("id, name, bio, slug")
          .eq("id", perfil.authorId)
          .maybeSingle(),
        "sua assinatura"
      )
    : null;

  // Diagnóstico: responde "o banco está com as migrações certas?" sem abrir
  // o Supabase. É a pergunta que apareceu toda vez que algo quebrou aqui.
  const ehAdmin = perfil.role === "admin";
  let diagnostico: Array<{ nome: string; valor: string; ok: boolean }> = [];

  if (ehAdmin) {
    const categorias = await supabase.from("categories").select("id", { count: "exact", head: true });
    const contagens = await Promise.all(
      ESTADOS_EDITORIAIS.map(async (estado) => {
        const r = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", estado);
        return `${rotuloDeEstado(estado)}: ${r.count ?? 0}`;
      })
    );
    // Chamada barata só para saber se a função existe no banco.
    const sonda = await supabase.rpc("article_body_for_edit", {
      p_id: "00000000-0000-0000-0000-000000000000",
    });

    diagnostico = [
      {
        nome: "Função article_body_for_edit",
        valor: sonda.error ? sonda.error.message : "responde",
        ok: !sonda.error,
      },
      {
        nome: "Categorias cadastradas",
        valor: String(categorias.count ?? 0),
        ok: (categorias.count ?? 0) >= 11,
      },
      { nome: "Matérias por estado", valor: contagens.join(" · "), ok: true },
    ];
  }

  return (
    <>
      <PageHeader
        titulo="Ajustes"
        descricao="Sua assinatura pública e o estado do sistema."
      />

      <div className="max-w-xl space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Sua assinatura</h2>
          {autor ? (
            <FormularioDeAssinatura nome={autor.name ?? ""} bio={autor.bio ?? ""} />
          ) : (
            <p className="rounded-lg bg-paper px-4 py-3 text-sm leading-relaxed text-ink-3">
              Sua conta ainda não tem assinatura pública. Sem ela não é possível
              criar matérias — peça ao administrador para criar o autor e
              vincular ao seu perfil.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Sua conta</h2>
          <dl className="divide-y divide-hairline rounded-lg border border-hairline bg-white">
            <Linha rotulo="E-mail" valor={perfil.email} />
            <Linha rotulo="Papel" valor={perfil.role === "admin" ? "Administrador" : "Colunista"} />
            <Linha rotulo="Endereço público" valor={autor?.slug ? `/colunistas/${autor.slug}` : "—"} />
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-4">
            E-mail e papel não se editam aqui: mudar papel é decisão de quem
            administra, e a troca é bloqueada também no banco.
          </p>
        </section>

        {ehAdmin && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Estado do sistema</h2>
            <dl className="divide-y divide-hairline rounded-lg border border-hairline bg-white">
              {diagnostico.map((d) => (
                <div key={d.nome} className="flex items-start gap-4 px-4 py-3">
                  <dt className="w-44 shrink-0 text-xs text-ink-3">{d.nome}</dt>
                  <dd className={`min-w-0 flex-1 break-words text-xs ${d.ok ? "text-ink-2" : "text-down"}`}>
                    {d.valor}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <dt className="w-44 shrink-0 text-xs text-ink-3">{rotulo}</dt>
      <dd className="min-w-0 flex-1 break-words text-xs text-ink-2">{valor}</dd>
    </div>
  );
}
```

- [ ] **Step 4: Verificar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: limpo.

No navegador: `/admin/ajustes` responde 200 (era 404), e o bloco de diagnóstico mostra "responde" para `article_body_for_edit`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/ajustes/"
git commit -m "feat(painel): tela de ajustes com assinatura e diagnóstico [FR-2]

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Painel inicial com o estado da redação

**Files:**
- Create: `src/lib/painel/resumo.ts`
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/lib/format.ts` (só `formatRelative`, para data futura)
- Test: `tests/painel/resumo.test.ts`
- Test: `tests/painel/formato.test.ts`

**Interfaces:**
- Consumes: `ESTADOS_EDITORIAIS`, `rotuloDeEstado`, `corDeEstado`, `exigir` (Tarefa 1); `formatRelative` de `@/lib/format`.
- Produces:
  - `interface LinhaDeResumo { status: string; updated_at: string; title: string; authors: { name: string | null } | null }`
  - `contarPorEstado(linhas: Array<{ status: string }>): Record<EstadoEditorial, number>`
  - `nomeDoAutor(linha: { authors: { name: string | null } | null }): string`

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/painel/resumo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contarPorEstado, nomeDoAutor } from "@/lib/painel/resumo";

describe("contagem por estado", () => {
  it("conta cada estado", () => {
    const c = contarPorEstado([
      { status: "draft" },
      { status: "draft" },
      { status: "in_review" },
      { status: "published" },
    ]);
    expect(c.draft).toBe(2);
    expect(c.in_review).toBe(1);
    expect(c.published).toBe(1);
  });

  it("estado sem nenhuma matéria vale zero, não indefinido", () => {
    // A tela soma e formata; indefinido viraria 'NaN' no painel.
    const c = contarPorEstado([]);
    expect(c.draft).toBe(0);
    expect(c.in_review).toBe(0);
    expect(c.scheduled).toBe(0);
    expect(c.published).toBe(0);
    expect(c.archived).toBe(0);
  });

  it("ignora estado que não é editorial em vez de quebrar", () => {
    const c = contarPorEstado([{ status: "limbo" }, { status: "draft" }]);
    expect(c.draft).toBe(1);
    expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe("nome do autor", () => {
  it("devolve o nome quando existe", () => {
    expect(nomeDoAutor({ authors: { name: "Da Redação" } })).toBe("Da Redação");
  });

  it("autor ausente não quebra a listagem", () => {
    // `authors(name)` volta nulo quando o autor foi apagado ou o vínculo
    // sumiu. A tela precisa continuar de pé.
    expect(nomeDoAutor({ authors: null })).toBe("Sem assinatura");
  });

  it("autor sem nome também", () => {
    expect(nomeDoAutor({ authors: { name: null } })).toBe("Sem assinatura");
  });
});
```

Criar `tests/painel/formato.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatRelative } from "@/lib/format";

const AGORA = new Date("2026-09-24T12:00:00Z");

describe("formatRelative", () => {
  it("minutos", () => {
    expect(formatRelative("2026-09-24T11:30:00Z", AGORA)).toBe("há 30 min");
  });

  it("horas", () => {
    expect(formatRelative("2026-09-24T07:00:00Z", AGORA)).toBe("há 5h");
  });

  it("data no futuro não vira minuto negativo", () => {
    // Matéria agendada tem `scheduled_for` à frente de agora. 'há -120 min'
    // é lixo na tela; 'em 2h' é informação.
    expect(formatRelative("2026-09-24T14:00:00Z", AGORA)).toBe("em 2h");
  });

  it("futuro em minutos", () => {
    expect(formatRelative("2026-09-24T12:45:00Z", AGORA)).toBe("em 45 min");
  });

  it("futuro em dias", () => {
    expect(formatRelative("2026-09-27T12:00:00Z", AGORA)).toBe("em 3 dias");
  });
});
```

- [ ] **Step 2: Rodar e verificar que falham**

Run: `npx vitest run tests/painel/resumo.test.ts tests/painel/formato.test.ts`
Expected: FAIL — módulo `resumo` inexistente; `formatRelative` devolvendo `há 1 min` para datas futuras.

- [ ] **Step 3: Escrever `src/lib/painel/resumo.ts`**

```ts
import { ESTADOS_EDITORIAIS, estadoValido, type EstadoEditorial } from "./estados";

/**
 * Contas do painel inicial, sobre linhas já carregadas.
 *
 * Sem I/O de propósito: quem filtra por autor é a RLS, e o painel apenas
 * conta o que voltou. O colunista vê os números dele sem nenhum `if` no
 * código — o banco já entregou só o que é dele.
 */
export function contarPorEstado(
  linhas: Array<{ status: string }>
): Record<EstadoEditorial, number> {
  const zero = Object.fromEntries(ESTADOS_EDITORIAIS.map((e) => [e, 0])) as Record<
    EstadoEditorial,
    number
  >;

  for (const linha of linhas) {
    if (estadoValido(linha.status)) zero[linha.status] += 1;
  }
  return zero;
}

/**
 * `authors(name)` volta nulo quando o autor foi apagado ou o vínculo sumiu.
 * A listagem precisa continuar de pé — e "Sem assinatura" é informação útil
 * para quem administra, não só um espaço em branco.
 */
export function nomeDoAutor(linha: { authors: { name: string | null } | null }): string {
  return linha.authors?.name?.trim() || "Sem assinatura";
}
```

- [ ] **Step 4: Tratar data futura em `formatRelative`**

Substituir a função em `src/lib/format.ts`:

```ts
/**
 * Distância humana até uma data.
 *
 * Trata futuro porque o painel mostra matéria agendada: `scheduled_for` está
 * à frente de agora, e a subtração crua produzia "há -120 min".
 */
export function formatRelative(iso: string, now = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const futuro = diffMs < 0;
  const abs = Math.abs(diffMs);
  const prefixo = (texto: string) => (futuro ? `em ${texto}` : `há ${texto}`);

  const minutes = Math.round(abs / 60000);
  if (minutes < 60) return prefixo(`${Math.max(minutes, 1)} min`);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return prefixo(`${hours}h`);
  const days = Math.round(hours / 24);
  if (days < 30) return prefixo(`${days} ${days === 1 ? "dia" : "dias"}`);
  return formatDateShort(iso);
}
```

- [ ] **Step 5: Rodar e verificar que passam**

Run: `npx vitest run tests/painel/`
Expected: PASS

- [ ] **Step 6: Escrever o painel inicial em `src/app/(admin)/admin/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { exigir } from "@/lib/painel/consulta";
import { ESTADOS_EDITORIAIS, corDeEstado, rotuloDeEstado } from "@/lib/painel/estados";
import { contarPorEstado, nomeDoAutor } from "@/lib/painel/resumo";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelInicial() {
  const perfil = await requirePainel();
  const supabase = await createClient();

  // Uma consulta só. A RLS já limita o colunista às próprias matérias, então
  // não há ramo no código: cada um conta o que o banco lhe entregou.
  const linhas = exigir(
    await supabase
      .from("articles")
      .select("id, title, status, updated_at, scheduled_for, authors(name)")
      .order("updated_at", { ascending: false })
      .limit(200),
    "o resumo das matérias"
  );

  const contagem = contarPorEstado(linhas);
  const emRevisao = linhas.filter((l) => l.status === "in_review");
  const agendadas = linhas.filter((l) => l.status === "scheduled");
  const recentes = linhas.slice(0, 8);

  return (
    <>
      <PageHeader
        titulo="Painel"
        descricao={
          perfil.role === "columnist"
            ? "O estado das suas colunas."
            : "O estado da redação agora."
        }
      />

      {/* A fila de revisão vem antes de qualquer número: é o único bloco que
          exige ação de alguém. Número é informação; fila é trabalho parado. */}
      {emRevisao.length > 0 && (
        <section className="mb-8 rounded-xl border border-[#e8dca8] bg-[#fdfaee] p-5">
          <h2 className="text-sm font-semibold text-[#7d6612]">
            {emRevisao.length === 1
              ? "1 matéria esperando revisão"
              : `${emRevisao.length} matérias esperando revisão`}
          </h2>
          <ul className="mt-3 divide-y divide-[#efe5c4]">
            {emRevisao.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/materias/${m.id}`}
                  className="flex items-baseline justify-between gap-4 py-2.5 transition-colors hover:text-forest-700"
                >
                  <span className="min-w-0 truncate text-sm text-ink">{m.title}</span>
                  <span className="shrink-0 text-[11px] text-ink-3">
                    {nomeDoAutor(m)} · {formatRelative(m.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ESTADOS_EDITORIAIS.map((estado) => (
          <Link
            key={estado}
            href={`/admin/materias?estado=${estado}`}
            className="rounded-xl border border-hairline bg-white p-4 transition-colors hover:border-forest-500"
          >
            <p className="text-2xl font-semibold tabular-nums text-ink">{contagem[estado]}</p>
            <p
              className={`mt-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${corDeEstado(estado)}`}
            >
              {rotuloDeEstado(estado)}
            </p>
          </Link>
        ))}
      </section>

      {agendadas.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">Na fila para publicar</h2>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
            {agendadas.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <Link href={`/admin/materias/${m.id}`} className="min-w-0 truncate text-sm text-ink hover:text-forest-700">
                  {m.title}
                </Link>
                <span className="shrink-0 text-[11px] text-ink-3">
                  {m.scheduled_for ? formatRelative(m.scheduled_for) : "sem data"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink">Editadas por último</h2>
          <Link href="/admin/materias" className="text-xs font-medium text-forest-700 hover:underline">
            Ver todas
          </Link>
        </div>
        {recentes.length === 0 ? (
          <p className="rounded-xl border border-hairline bg-white px-4 py-8 text-center text-sm text-ink-3">
            Nenhuma matéria ainda.{" "}
            <Link href="/admin/materias" className="text-forest-700 hover:underline">
              Comece a primeira.
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
            {recentes.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link href={`/admin/materias/${m.id}`} className="min-w-0 flex-1 truncate text-sm text-ink hover:text-forest-700">
                  {m.title}
                </Link>
                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${corDeEstado(m.status)}`}>
                  {rotuloDeEstado(m.status)}
                </span>
                <span className="w-32 shrink-0 text-right text-[11px] text-ink-3">
                  {nomeDoAutor(m)}
                </span>
                <span className="w-20 shrink-0 text-right text-[11px] text-ink-3">
                  {formatRelative(m.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 7: Acrescentar "Painel" ao menu**

Em `src/lib/auth/rules.ts`, no começo de `MENU`:

```ts
const MENU: Array<ItemDeMenu & { papeis: Role[] }> = [
  { href: "/admin", rotulo: "Painel", papeis: ["admin", "columnist"] },
  { href: "/admin/materias", rotulo: "Matérias", papeis: ["admin", "columnist"] },
  { href: "/admin/colunistas", rotulo: "Colunistas", papeis: ["admin"] },
  { href: "/admin/midia", rotulo: "Mídia", papeis: ["admin", "columnist"] },
  { href: "/admin/ajustes", rotulo: "Ajustes", papeis: ["admin"] },
];
```

Conferir se `tests/auth/rules.test.ts` afirma o tamanho ou o conteúdo de `itensDeMenu` — se afirmar, atualizar a expectativa para incluir `/admin`.

- [ ] **Step 8: Verificar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: limpo.

- [ ] **Step 9: Commit**

```bash
git add src/lib/painel/resumo.ts src/lib/format.ts "src/app/(admin)/admin/page.tsx" src/lib/auth/rules.ts tests/painel/resumo.test.ts tests/painel/formato.test.ts tests/auth/rules.test.ts
git commit -m "feat(painel): painel inicial com fila de revisão e estado da redação [FR-3]

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: O editor não perde trabalho

**Files:**
- Create: `src/lib/painel/confirmacao.ts`
- Modify: `src/app/(admin)/admin/materias/[id]/EditorDeMateria.tsx`
- Test: `tests/painel/confirmacao.test.ts`

**Interfaces:**
- Consumes: `salvarMateria`, `mudarEstado`, `excluirMateria` de `../actions`; `rotuloDeEstado`, `corDeEstado` (Tarefa 1).
- Produces: `confirmacaoConfere(digitado: string, titulo: string): boolean`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/painel/confirmacao.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { confirmacaoConfere } from "@/lib/painel/confirmacao";

describe("confirmação de exclusão pelo título", () => {
  it("confere quando é igual", () => {
    expect(confirmacaoConfere("Susep muda regra", "Susep muda regra")).toBe(true);
  });

  it("aceita espaços em volta — quem copia da tela traz espaço", () => {
    expect(confirmacaoConfere("  Susep muda regra  ", "Susep muda regra")).toBe(true);
  });

  it("aceita diferença de caixa", () => {
    expect(confirmacaoConfere("susep MUDA regra", "Susep muda regra")).toBe(true);
  });

  it("NÃO aceita título parcial", () => {
    expect(confirmacaoConfere("Susep", "Susep muda regra")).toBe(false);
  });

  it("NÃO aceita vazio, nem quando o título é vazio", () => {
    // Título em branco não pode virar 'é só apertar Enter e some'.
    expect(confirmacaoConfere("", "Susep muda regra")).toBe(false);
    expect(confirmacaoConfere("", "")).toBe(false);
    expect(confirmacaoConfere("   ", "   ")).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run tests/painel/confirmacao.test.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Escrever `src/lib/painel/confirmacao.ts`**

```ts
/**
 * Exclusão pede o título digitado.
 *
 * Excluir é a única ação do painel que não tem volta: não há lixeira, e a
 * linha some com o texto junto. Um `confirm()` de navegador é clicado no
 * automático; digitar o título obriga a olhar o que se está apagando.
 *
 * Tolerante com espaço e com caixa porque quem copia o título da tela traz
 * espaço, e recusar por isso é hostil sem ser mais seguro. Título vazio nunca
 * confere: senão a confirmação viraria apertar Enter.
 */
export function confirmacaoConfere(digitado: string, titulo: string): boolean {
  const a = digitado.trim().toLocaleLowerCase("pt-BR");
  const b = titulo.trim().toLocaleLowerCase("pt-BR");
  if (a.length === 0 || b.length === 0) return false;
  return a === b;
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run tests/painel/confirmacao.test.ts`
Expected: PASS — 5 testes

- [ ] **Step 5: Marcar sujo/salvo e avisar antes de sair**

Em `EditorDeMateria.tsx`, acrescentar os imports e o estado:

```tsx
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { corDeEstado, rotuloDeEstado } from "@/lib/painel/estados";
import { confirmacaoConfere } from "@/lib/painel/confirmacao";
```

Dentro do componente, depois de `const [doc, setDoc] = useState<DocumentoBlocos>(corpo);`:

```tsx
const [sujo, setSujo] = useState(false);
const formRef = useRef<HTMLFormElement>(null);

// Alteração no corpo ou em qualquer campo do formulário marca sujo. O
// `onInput` no form cobre título, linha de apoio e o trilho de metadados sem
// precisar controlar cada campo.
function mudouOCorpo(novo: DocumentoBlocos) {
  setDoc(novo);
  setSujo(true);
}

// Fechar a aba com texto não salvo é a perda mais boba que existe. O
// navegador só mostra o aviso se houver interação prévia na página — o que
// sempre houve, porque a pessoa estava escrevendo.
useEffect(() => {
  if (!sujo) return;
  const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
  window.addEventListener("beforeunload", aviso);
  return () => window.removeEventListener("beforeunload", aviso);
}, [sujo]);

// Salvamento concluído limpa a marca.
useEffect(() => {
  if (estado.status === "salvo") setSujo(false);
}, [estado.status, estado.updatedAt]);
```

Trocar `<form action={acao}>` por:

```tsx
<form ref={formRef} action={acao} onInput={() => setSujo(true)}>
```

e `<Editor inicial={doc} onChange={setDoc} />` por:

```tsx
<Editor inicial={doc} onChange={mudouOCorpo} />
```

Acrescentar o indicador ao lado do estado, logo depois do `<span>` do rótulo:

```tsx
{sujo ? (
  <span className="text-xs text-[#7d6612]">Não salvo</span>
) : (
  estado.status === "salvo" && <span className="text-xs text-forest-700">{estado.mensagem}</span>
)}
```

e remover o bloco `{estado.status === "salvo" && ...}` que existia solto, para não duplicar a mensagem.

- [ ] **Step 6: Transições de estado com pendência**

Trocar a função `transicao` por:

```tsx
const [transicionando, iniciarTransicao] = useTransition();

function transicao(novo: string, agendadoPara?: string) {
  setAvisoEstado(undefined);
  iniciarTransicao(async () => {
    const r = await mudarEstado(materia.id, novo, agendadoPara);
    setAvisoEstado(r.mensagem);
    if (r.status === "salvo") setStatusAtual(novo);
  });
}
```

e acrescentar `disabled={transicionando}` a cada botão de transição ("Enviar para revisão", "Devolver", "Publicar", "Arquivar"), com `disabled:opacity-60` na classe. Sem isso dá para clicar duas vezes e disparar duas gravações.

- [ ] **Step 7: Exclusão com o título digitado**

Antes do `</form>` de fechamento, para admin, acrescentar:

```tsx
{ehAdmin && (
  <section className="mt-10 border-t border-hairline pt-6">
    <h2 className="text-sm font-semibold text-ink">Excluir esta matéria</h2>
    <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink-3">
      Não há lixeira: a matéria e o texto somem de vez. Para confirmar, digite
      o título exatamente como está acima.
    </p>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        placeholder={materia.title}
        aria-label="Digite o título para confirmar a exclusão"
        className="w-72 rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-down"
      />
      <button
        type="button"
        disabled={!confirmacaoConfere(confirmacao, materia.title) || transicionando}
        onClick={() => iniciarTransicao(() => excluirMateria(materia.id))}
        className="rounded-lg border border-down px-4 py-2 text-xs font-semibold text-down transition-colors hover:bg-down hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-down"
      >
        Excluir definitivamente
      </button>
    </div>
  </section>
)}
```

com o estado no topo do componente:

```tsx
const [confirmacao, setConfirmacao] = useState("");
```

e `excluirMateria` acrescentado ao import de `../actions`.

- [ ] **Step 8: Verificar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: limpo.

No navegador: escrever algo, tentar fechar a aba → navegador pede confirmação. Salvar → "Não salvo" vira "Salvo.". Digitar o título errado → botão de excluir continua desabilitado.

- [ ] **Step 9: Commit**

```bash
git add src/lib/painel/confirmacao.ts "src/app/(admin)/admin/materias/[id]/EditorDeMateria.tsx" tests/painel/confirmacao.test.ts
git commit -m "feat(editor): aviso de trabalho não salvo, transições com pendência e exclusão confirmada [FR-5]

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Portão de publicação

**Files:**
- Create: `src/lib/painel/publicacao.ts`
- Modify: `src/app/(admin)/admin/materias/actions.ts`
- Test: `tests/painel/publicacao.test.ts`

**Interfaces:**
- Consumes: `documentoVazio`, `extrairTexto`, `type DocumentoBlocos` de `@/lib/editor/document`.
- Produces:
  - `interface MateriaParaPublicar { title: string; category_id: number | null; slug: string; corpo: DocumentoBlocos | null }`
  - `pendenciasParaPublicar(m: MateriaParaPublicar): string[]`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/painel/publicacao.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { pendenciasParaPublicar } from "@/lib/painel/publicacao";
import type { DocumentoBlocos } from "@/lib/editor/document";

const corpoBom = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Tem texto aqui." }] }],
} as DocumentoBlocos;

const completa = {
  title: "Susep muda a regra de capital",
  category_id: 3,
  slug: "susep-muda-a-regra-de-capital",
  corpo: corpoBom,
};

describe("portão de publicação", () => {
  it("matéria completa não tem pendência", () => {
    expect(pendenciasParaPublicar(completa)).toEqual([]);
  });

  it("título curto é pendência", () => {
    expect(pendenciasParaPublicar({ ...completa, title: "Oi" })).toContain(
      "o título precisa de pelo menos três caracteres"
    );
  });

  it("sem categoria é pendência — matéria sem editoria some do portal", () => {
    expect(pendenciasParaPublicar({ ...completa, category_id: null })).toContain(
      "escolha uma categoria"
    );
  });

  it("endereço provisório é pendência", () => {
    // `criarMateria` grava `rascunho-<timestamp>`. Publicar assim põe no ar
    // uma URL que ninguém consegue adivinhar nem corrigir depois.
    expect(pendenciasParaPublicar({ ...completa, slug: "rascunho-mug0vle1" })).toContain(
      "troque o endereço provisório da matéria"
    );
  });

  it("corpo com só um parágrafo vazio conta como vazio", () => {
    // É exatamente o documento que `criarMateria` grava. Sem isto, toda
    // matéria recém-criada passaria no portão.
    const vazio = { type: "doc", content: [{ type: "paragraph" }] } as DocumentoBlocos;
    expect(pendenciasParaPublicar({ ...completa, corpo: vazio })).toContain(
      "escreva o corpo da matéria"
    );
  });

  it("corpo com só espaços também conta como vazio", () => {
    const branco = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "   " }] }],
    } as DocumentoBlocos;
    expect(pendenciasParaPublicar({ ...completa, corpo: branco })).toContain(
      "escreva o corpo da matéria"
    );
  });

  it("corpo nulo conta como vazio", () => {
    expect(pendenciasParaPublicar({ ...completa, corpo: null })).toContain(
      "escreva o corpo da matéria"
    );
  });

  it("lista TODAS as pendências de uma vez, não uma por vez", () => {
    // Corrigir, salvar, descobrir o próximo erro, repetir — é o que torna um
    // formulário insuportável.
    const p = pendenciasParaPublicar({
      title: "Oi",
      category_id: null,
      slug: "rascunho-abc",
      corpo: null,
    });
    expect(p).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run tests/painel/publicacao.test.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Escrever `src/lib/painel/publicacao.ts`**

```ts
import { extrairTexto, type DocumentoBlocos } from "@/lib/editor/document";

export interface MateriaParaPublicar {
  title: string;
  category_id: number | null;
  slug: string;
  corpo: DocumentoBlocos | null;
}

/**
 * O que ainda falta para esta matéria ir ao ar.
 *
 * Devolve tudo de uma vez. Um erro por vez transforma publicar em ciclo de
 * tentativa e frustração, e quem está fechando matéria costuma estar com
 * pressa.
 *
 * Isto é conveniência de interface, não barreira: quem impede de verdade é a
 * RLS, que só deixa admin gravar `published`. O portão evita o acidente, não
 * o ataque.
 */
export function pendenciasParaPublicar(materia: MateriaParaPublicar): string[] {
  const faltas: string[] = [];

  if (materia.title.trim().length < 3) {
    faltas.push("o título precisa de pelo menos três caracteres");
  }
  if (materia.category_id === null) {
    faltas.push("escolha uma categoria");
  }
  // `criarMateria` grava `rascunho-<base36 do relógio>`. É endereço de
  // trabalho: publicar com ele põe no ar uma URL impossível de adivinhar e
  // que, depois de indexada, não se corrige sem quebrar link.
  if (/^rascunho-/.test(materia.slug.trim())) {
    faltas.push("troque o endereço provisório da matéria");
  }
  if (!materia.corpo || extrairTexto(materia.corpo).trim().length === 0) {
    faltas.push("escreva o corpo da matéria");
  }

  return faltas;
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run tests/painel/publicacao.test.ts`
Expected: PASS — 8 testes

- [ ] **Step 5: Aplicar o portão em `mudarEstado`**

Em `src/app/(admin)/admin/materias/actions.ts`, acrescentar ao topo:

```ts
import { pendenciasParaPublicar } from "@/lib/painel/publicacao";
```

e, dentro de `mudarEstado`, logo depois da checagem de papel do colunista:

```ts
  // Portão de publicação: o que falta é conferido no servidor, com o dado do
  // banco, e não com o que o formulário disse. O corpo vem pela função, que é
  // o único caminho — a coluna está revogada de `authenticated`.
  if (novoEstado === "published" || novoEstado === "scheduled") {
    const supabaseConfere = await createClient();

    const { data: linha, error: erroLinha } = await supabaseConfere
      .from("articles")
      .select("title, category_id, slug")
      .eq("id", id)
      .maybeSingle();

    if (erroLinha || !linha) {
      return {
        status: "erro",
        mensagem: `Não foi possível conferir a matéria: ${erroLinha?.message ?? "não encontrada"}`,
      };
    }

    const { data: corpo } = await supabaseConfere.rpc("article_body_for_edit", { p_id: id });

    const faltas = pendenciasParaPublicar({
      title: linha.title ?? "",
      category_id: linha.category_id,
      slug: linha.slug ?? "",
      corpo: corpo as unknown as DocumentoBlocos | null,
    });

    if (faltas.length > 0) {
      return {
        status: "erro",
        mensagem: `Antes de publicar: ${faltas.join("; ")}.`,
      };
    }
  }
```

- [ ] **Step 6: Verificar**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: limpo, 132 testes.

No navegador: criar matéria nova, escrever o título, tentar publicar direto → a mensagem lista categoria, endereço e corpo de uma vez.

- [ ] **Step 7: Commit**

```bash
git add src/lib/painel/publicacao.ts "src/app/(admin)/admin/materias/actions.ts" tests/painel/publicacao.test.ts
git commit -m "feat(painel): portão de publicação lista tudo que falta de uma vez [FR-6]

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Autorrevisão

**1. Cobertura da spec.**

| Requisito | Tarefa |
|---|---|
| FR-1.1 a FR-1.6 (porta da redação, motivos, noindex) | 2 |
| CON-1 (`/login` intacto) | 2 — nenhum arquivo de `(portal)/login` é tocado |
| FR-2.1 a FR-2.4 (ajustes, assinatura, diagnóstico) | 3 |
| FR-3.1 a FR-3.5 (painel inicial, fila primeiro) | 4 |
| FR-4.1 a FR-4.3 (erro não engolido, fronteira) | 1 |
| FR-5.1 a FR-5.4 (sujo, pendência, exclusão) | 5 |
| FR-6.1 a FR-6.3 (portão) | 6 |
| NFR-1 (sem tabela nova) | nenhuma tarefa cria migração |
| NFR-2 (regra em `.ts`) | 6 módulos puros, 6 arquivos de teste |
| NFR-3 (corpo só por função) | Tarefa 6 usa `article_body_for_edit`; nenhuma consulta nova pede coluna de corpo |
| NFR-4, NFR-5 | classes Tailwind e `robots` nas telas novas |

**2. Marcadores de posição.** Nenhum "TBD", nenhum "tratar erros apropriadamente". Todo passo de código tem o código.

**3. Consistência de tipos.** `estadoValido(valor: unknown)` é o mesmo em todos os usos; `exigir<T>` devolve `T` e é chamado com `await consulta` inteiro, nunca desestruturado antes; `contarPorEstado` recebe `Array<{ status: string }>`, que é subconjunto do que a consulta do painel devolve; `nomeDoAutor` recebe `{ authors: { name: string | null } | null }`, que é a forma que o PostgREST devolve para `authors(name)` em relação um-para-um; `pendenciasParaPublicar` recebe `corpo: DocumentoBlocos | null` e a Tarefa 6 passa o retorno do RPC com essa asserção.

**4. Review Focus.** Os cinco casos têm teste: motivo arbitrário (Tarefa 2, passo 1), autor nulo (Tarefa 4, passo 1), parágrafo vazio no portão (Tarefa 6, passo 1), espaços no título da confirmação (Tarefa 5, passo 1), data futura em `formatRelative` (Tarefa 4, passo 1).

---

## O que fica para depois

Três planos separados, cada um com software funcionando por conta própria:

1. **Flash do Mercado e Eventos** — tabelas novas, RLS, CRUD no painel. Hoje são fixtures em `src/lib/data/index.ts`.
2. **Conteúdos do Hub** — indicadores, rankings, radar e relatórios. O maior dos três, e o que depende de você inserir dado real.
3. **Biblioteca de mídia e publicação agendada** — upload de imagem e `pg_cron` para o `scheduled_for` disparar sozinho. Sem o cron, matéria agendada fica agendada para sempre.
