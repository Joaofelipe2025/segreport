"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  salvarMateria,
  mudarEstado,
  excluirMateria,
  type EstadoMateria,
} from "../actions";
import type { DocumentoBlocos } from "@/lib/editor/document";
import type { Role } from "@/lib/auth/rules";
import { corDeEstado, rotuloDeEstado } from "@/lib/painel/estados";
import { confirmacaoConfere } from "@/lib/painel/confirmacao";
import { useGuardaDeSaida } from "@/components/admin/GuardaDeSaida";

// O editor só existe no navegador: o ProseMirror precisa de DOM.
const Editor = dynamic(() => import("@/components/editor/Editor"), {
  ssr: false,
  loading: () => <div className="min-h-[420px] animate-pulse rounded-lg bg-paper" />,
});

const INICIAL: EstadoMateria = { status: "inicial" };

export interface MateriaParaEditar {
  /** Nulo enquanto a matéria não existe: a linha nasce no primeiro salvamento. */
  id: string | null;
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
  // A marca vive no contexto do painel, não aqui: quem oferece a saída é a
  // barra lateral, que está em outro ramo da árvore.
  const { sujo, marcarSujo: setSujo } = useGuardaDeSaida();
  const [confirmacao, setConfirmacao] = useState("");
  const [transicionando, iniciarTransicao] = useTransition();

  const carimbo = estado.updatedAt ?? materia.updated_at;
  const ehAdmin = papel === "admin";
  const existe = materia.id !== null;

  function mudouOCorpo(novo: DocumentoBlocos) {
    setDoc(novo);
    setSujo(true);
  }

  // O provedor vive no layout e sobrevive à troca de rota. Sem esta limpeza,
  // a marca ficaria acesa depois de sair do editor, e o aviso passaria a
  // aparecer em telas onde não há nada para perder — que é como se ensina
  // alguém a clicar em "sair" sem ler.
  useEffect(() => () => setSujo(false), [setSujo]);

  // Fechar a aba com texto não salvo é a perda mais boba que existe. O
  // navegador só mostra o aviso se já houve interação na página — o que
  // sempre houve, porque a pessoa estava escrevendo.
  useEffect(() => {
    if (!sujo) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sujo]);

  // Salvamento concluído limpa a marca.
  //
  // Ajuste durante a renderização, não em efeito: em efeito, a tela pisca uma
  // vez mostrando "Não salvo" depois de já ter salvo. O carimbo é a chave
  // porque dois salvamentos seguidos deixam `status` em "salvo" o tempo todo
  // — só a mudança de `updatedAt` distingue um do outro.
  const [carimboVisto, setCarimboVisto] = useState(estado.updatedAt);
  if (estado.status === "salvo" && estado.updatedAt !== carimboVisto) {
    setCarimboVisto(estado.updatedAt);
    setSujo(false);
  }

  function transicao(novo: string, agendadoPara?: string) {
    // Só existe transição para matéria que existe; os botões nem aparecem
    // antes disso. A checagem é para o TypeScript e para o clique impossível.
    if (!materia.id) return;
    const idDaMateria = materia.id;

    setAvisoEstado(undefined);
    iniciarTransicao(async () => {
      const r = await mudarEstado(idDaMateria, novo, agendadoPara);
      setAvisoEstado(r.mensagem);
      if (r.status === "salvo") setStatusAtual(novo);
    });
  }

  const ocupado = pendente || transicionando;

  return (
    <form action={acao} onInput={() => setSujo(true)}>
      {materia.id && <input type="hidden" name="id" value={materia.id} />}
      <input type="hidden" name="updated_at" value={carimbo} />
      <input type="hidden" name="content_json" value={JSON.stringify(doc)} />

      {/* Barra superior: estado e ações ---------------------------------- */}
      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-hairline pb-4">
        <span
          className={`rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${corDeEstado(statusAtual)}`}
        >
          {rotuloDeEstado(statusAtual)}
        </span>

        {sujo ? (
          <span className="text-xs text-[#7d6612]">Não salvo</span>
        ) : (
          estado.status === "salvo" && (
            <span className="text-xs text-forest-700">{estado.mensagem}</span>
          )
        )}

        {estado.status === "erro" && (
          <span role="alert" className="max-w-md text-xs leading-relaxed text-down">
            {estado.mensagem}
          </span>
        )}
        {estado.status === "conflito" && (
          <span role="alert" className="max-w-md text-xs leading-relaxed text-down">
            {estado.mensagem}
          </span>
        )}
        {avisoEstado && (
          <span className="max-w-md text-xs leading-relaxed text-ink-3">{avisoEstado}</span>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={ocupado}
            className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-forest-500 disabled:opacity-60"
          >
            {pendente ? "Salvando…" : existe ? "Salvar" : "Criar matéria"}
          </button>

          {existe && statusAtual === "draft" && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => transicao("in_review")}
              className="rounded-lg bg-forest-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
            >
              Enviar para revisão
            </button>
          )}

          {existe && ehAdmin && statusAtual === "in_review" && (
            <>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => transicao("draft")}
                className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-forest-500 disabled:opacity-60"
              >
                Devolver
              </button>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => transicao("published")}
                className="rounded-lg bg-lime-400 px-4 py-2 text-xs font-semibold text-forest-800 transition-colors hover:bg-lime-500 disabled:opacity-60"
              >
                Publicar
              </button>
            </>
          )}

          {existe && ehAdmin && statusAtual === "published" && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => transicao("archived")}
              className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-forest-500 disabled:opacity-60"
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
            <Editor inicial={doc} onChange={mudouOCorpo} />
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
            Capa e tags entram na próxima fase. O acesso da matéria — aberta ou
            paga — é decisão comercial e só o administrador muda.
          </p>
        </aside>
      </div>

      {/* Exclusão: a única ação do painel sem volta ----------------------- */}
      {existe && ehAdmin && (
        <section className="mt-10 border-t border-hairline pt-6">
          <h2 className="text-sm font-semibold text-ink">Excluir esta matéria</h2>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink-3">
            Não há lixeira: a matéria e o texto somem de vez. Para confirmar,
            digite o título exatamente como está acima.
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
              disabled={!confirmacaoConfere(confirmacao, materia.title) || ocupado}
              onClick={() =>
                iniciarTransicao(async () => {
                  // Sucesso redireciona e nunca volta; só a recusa retorna.
                  if (!materia.id) return;
                  const r = await excluirMateria(materia.id);
                  setAvisoEstado(r.mensagem);
                })
              }
              className="rounded-lg border border-down px-4 py-2 text-xs font-semibold text-down transition-colors hover:bg-down hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-down"
            >
              Excluir definitivamente
            </button>
          </div>
        </section>
      )}
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
