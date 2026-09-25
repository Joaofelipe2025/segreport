import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";
import { exigir } from "@/lib/painel/consulta";
import {
  corDeEstado,
  estadoValido,
  rotuloDeEstado,
  type EstadoEditorial,
} from "@/lib/painel/estados";

export const metadata: Metadata = { title: "Matérias" };

const FILTROS: Array<{ valor: "" | EstadoEditorial; rotulo: string }> = [
  { valor: "", rotulo: "Todas" },
  { valor: "in_review", rotulo: "Em revisão" },
  { valor: "draft", rotulo: "Rascunhos" },
  { valor: "scheduled", rotulo: "Agendadas" },
  { valor: "published", rotulo: "Publicadas" },
];

export default async function MateriasPage(props: PageProps<"/admin/materias">) {
  const params = await props.searchParams;
  const filtro = typeof params.estado === "string" ? params.estado : "";

  const perfil = await requirePainel();
  const supabase = await createClient();

  let consulta = supabase
    .from("articles")
    .select("id, title, status, updated_at, author_id, authors(name)")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (estadoValido(filtro)) consulta = consulta.eq("status", filtro);

  const materias = exigir(await consulta, "as matérias");

  // A fila de revisão é o que o admin abre primeiro: é o trabalho pendente
  // dele, e some da vista se ficar misturado com o resto.
  const emRevisao = materias.filter((m) => m.status === "in_review");

  return (
    <>
      <PageHeader
        titulo="Matérias"
        descricao={
          perfil.role === "columnist"
            ? "Suas colunas. Escreva, envie para revisão e acompanhe o status."
            : "Todas as matérias do portal, de qualquer autor."
        }
        acao={
          // Link, não formulário: navegar não grava no banco. A linha nasce
          // no primeiro salvamento, quando já existe um título.
          <Link
            href="/admin/materias/nova"
            className="rounded-lg bg-forest-800 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-700"
          >
            + Nova matéria
          </Link>
        }
      />

      {perfil.role === "admin" && emRevisao.length > 0 && !filtro && (
        <Link
          href="/admin/materias?estado=in_review"
          className="mb-5 flex items-center gap-3 rounded-xl border border-[#e8d9a8] bg-[#fbf6e0] px-4 py-3 transition-colors hover:bg-[#f7f0d4]"
        >
          <span className="text-sm font-semibold text-[#7d6612]">
            {emRevisao.length}{" "}
            {emRevisao.length === 1 ? "matéria aguarda" : "matérias aguardam"} sua revisão
          </span>
          <span className="ml-auto text-xs text-[#7d6612]">Ver fila →</span>
        </Link>
      )}

      <div className="mb-5 flex flex-wrap gap-1 rounded-lg bg-forest-100 p-1">
        {FILTROS.map((f) => {
          const ativo = f.valor === filtro;
          return (
            <Link
              key={f.valor || "todas"}
              href={f.valor ? `/admin/materias?estado=${f.valor}` : "/admin/materias"}
              aria-current={ativo ? "true" : undefined}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                ativo ? "bg-lime-400 text-forest-800" : "text-forest-700 hover:bg-forest-200"
              }`}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-hairline bg-white">
        {materias.length > 0 ? (
          <ul className="divide-y divide-hairline">
            {materias.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/materias/${m.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 transition-colors hover:bg-paper"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {m.title}
                  </span>
                  <span className="text-xs text-ink-3">
                    {(m.authors as { name: string } | null)?.name ?? "—"}
                  </span>
                  <span
                    className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${corDeEstado(m.status)}`}
                  >
                    {rotuloDeEstado(m.status)}
                  </span>
                  <span className="w-24 shrink-0 text-right font-mono text-[11px] text-ink-4">
                    {formatRelative(m.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-ink-3">
              {filtro
                ? "Nenhuma matéria neste estado."
                : "Nenhuma matéria ainda. Crie a primeira."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
