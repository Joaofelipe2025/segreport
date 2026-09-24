"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { salvarMateria, mudarEstado, type EstadoMateria } from "../actions";
import type { DocumentoBlocos } from "@/lib/editor/document";
import type { Role } from "@/lib/auth/rules";

// O editor só existe no navegador: o ProseMirror precisa de DOM.
const Editor = dynamic(() => import("@/components/editor/Editor"), {
  ssr: false,
  loading: () => <div className="min-h-[420px] animate-pulse rounded-lg bg-paper" />,
});

const INICIAL: EstadoMateria = { status: "inicial" };

export interface MateriaParaEditar {
  id: string;
  slug: string;
  title: string;
  standfirst: string | null;
  status: string;
  category_id: number | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  is_premium: boolean;
}

const ROTULO_ESTADO: Record<string, string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  scheduled: "Agendada",
  published: "Publicada",
  archived: "Arquivada",
};

const COR_ESTADO: Record<string, string> = {
  draft: "bg-paper text-ink-3",
  in_review: "bg-[#fbf6e0] text-[#7d6612]",
  scheduled: "bg-[#e6f0fb] text-[#1f5590]",
  published: "bg-[#e7f5ec] text-[#1e6b40]",
  archived: "bg-paper text-ink-4",
};

export default function EditorDeMateria({
  materia,
  corpo,
  categorias,
  papel,
}: {
  materia: MateriaParaEditar;
  /**
   * Chega pronto do servidor e é obrigatório. Antes o corpo vinha junto com a
   * matéria e podia ser nulo, e o editor inventava um documento vazio no
   * lugar — que o Salvar seguinte gravava por cima do texto real. Quem não
   * conseguiu ler o corpo não chega a renderizar este componente.
   */
  corpo: DocumentoBlocos;
  categorias: Array<{ id: number; label: string }>;
  papel: Role;
}) {
  const [estado, acao, pendente] = useActionState(salvarMateria, INICIAL);
  const [doc, setDoc] = useState<DocumentoBlocos>(corpo);
  const [statusAtual, setStatusAtual] = useState(materia.status);
  const [avisoEstado, setAvisoEstado] = useState<string>();

  const carimbo = estado.updatedAt ?? materia.updated_at;
  const ehAdmin = papel === "admin";

  async function transicao(novo: string, agendadoPara?: string) {
    const r = await mudarEstado(materia.id, novo, agendadoPara);
    setAvisoEstado(r.mensagem);
    if (r.status === "salvo") setStatusAtual(novo);
  }

  return (
    <form action={acao}>
      <input type="hidden" name="id" value={materia.id} />
      <input type="hidden" name="updated_at" value={carimbo} />
      <input type="hidden" name="content_json" value={JSON.stringify(doc)} />

      {/* Barra superior: estado e ações ---------------------------------- */}
      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-hairline pb-4">
        <span
          className={`rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${COR_ESTADO[statusAtual] ?? ""}`}
        >
          {ROTULO_ESTADO[statusAtual] ?? statusAtual}
        </span>

        {estado.status === "salvo" && (
          <span className="text-xs text-forest-700">{estado.mensagem}</span>
        )}
        {estado.status === "erro" && (
          <span role="alert" className="text-xs text-down">
            {estado.mensagem}
          </span>
        )}
        {estado.status === "conflito" && (
          <span role="alert" className="max-w-md text-xs leading-relaxed text-down">
            {estado.mensagem}
          </span>
        )}
        {avisoEstado && <span className="text-xs text-ink-3">{avisoEstado}</span>}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-forest-500 disabled:opacity-60"
          >
            {pendente ? "Salvando…" : "Salvar"}
          </button>

          {statusAtual === "draft" && (
            <button
              type="button"
              onClick={() => transicao("in_review")}
              className="rounded-lg bg-forest-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest-700"
            >
              Enviar para revisão
            </button>
          )}

          {ehAdmin && statusAtual === "in_review" && (
            <>
              <button
                type="button"
                onClick={() => transicao("draft")}
                className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-forest-500"
              >
                Devolver
              </button>
              <button
                type="button"
                onClick={() => transicao("published")}
                className="rounded-lg bg-lime-400 px-4 py-2 text-xs font-semibold text-forest-800 transition-colors hover:bg-lime-500"
              >
                Publicar
              </button>
            </>
          )}

          {ehAdmin && statusAtual === "published" && (
            <button
              type="button"
              onClick={() => transicao("archived")}
              className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-forest-500"
            >
              Arquivar
            </button>
          )}
        </div>
      </div>

      {/* Escrita ao centro, metadados à direita --------------------------- */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <input
            name="title"
            defaultValue={materia.title}
            placeholder="Título da matéria"
            className="w-full border-0 bg-transparent p-0 text-2xl font-bold leading-tight tracking-[-0.02em] text-ink outline-none placeholder:text-ink-4 sm:text-[30px]"
          />
          <input
            name="standfirst"
            defaultValue={materia.standfirst ?? ""}
            placeholder="Linha de apoio — o que a matéria acrescenta em uma frase"
            className="mt-2 w-full border-0 bg-transparent p-0 text-base leading-relaxed text-ink-3 outline-none placeholder:text-ink-4"
          />

          <div className="mt-6">
            <Editor inicial={doc} onChange={setDoc} />
          </div>
        </div>

        {/* Trilho de metadados — sempre à vista, nunca em gaveta.
            Em notícia, esquecer a categoria tira a matéria da editoria. */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Campo rotulo="Categoria">
            <select
              name="category_id"
              defaultValue={materia.category_id ?? ""}
              className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Endereço da matéria">
            <input
              name="slug"
              defaultValue={materia.slug}
              disabled={!ehAdmin}
              className="w-full rounded-lg border border-hairline bg-white px-3 py-2 font-mono text-[12px] outline-none focus:border-forest-500 disabled:bg-paper disabled:text-ink-4"
            />
          </Campo>

          <Campo rotulo="Título para busca">
            <input
              name="seo_title"
              defaultValue={materia.seo_title ?? ""}
              maxLength={60}
              className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
            />
          </Campo>

          <Campo rotulo="Resumo para busca">
            <textarea
              name="seo_description"
              defaultValue={materia.seo_description ?? ""}
              rows={3}
              maxLength={160}
              className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
            />
          </Campo>

          <p className="rounded-lg bg-paper px-3 py-2.5 text-[11px] leading-relaxed text-ink-3">
            Capa e tags entram na próxima fase. O acesso da matéria —
            aberta ou paga — é decisão comercial e só o administrador muda.
          </p>
        </aside>
      </div>
    </form>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
        {rotulo}
      </p>
      {children}
    </div>
  );
}
