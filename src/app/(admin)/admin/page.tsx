import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { exigir, FalhaDeConsulta } from "@/lib/painel/consulta";
import {
  ESTADOS_EDITORIAIS,
  corDeEstado,
  rotuloDeEstado,
  type EstadoEditorial,
} from "@/lib/painel/estados";
import { nomeDoAutor } from "@/lib/painel/resumo";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelInicial() {
  const perfil = await requirePainel();
  const supabase = await createClient();

  const campos = "id, title, status, updated_at, scheduled_for, authors(name)";

  // Quatro consultas, não uma. A versão anterior lia as 200 mais recentemente
  // editadas e tirava tudo dali — e a partir de 200 matérias os números viravam
  // ficção: os cartões somavam 200 sem dizer que havia corte, e uma matéria em
  // revisão parada há meses caía fora da janela e SUMIA da fila. O bloco que
  // existe para mostrar trabalho parado escondia justamente o que estava
  // parado há mais tempo.
  //
  // A RLS já limita o colunista às próprias matérias: não há ramo por papel
  // aqui, cada um conta o que o banco lhe entregou.
  const [porEstado, filaDeRevisao, naFila, ultimas] = await Promise.all([
    Promise.all(
      ESTADOS_EDITORIAIS.map(async (estado) => {
        const r = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", estado);
        if (r.error) throw new FalhaDeConsulta("as contagens do painel", r.error.message);
        return [estado, r.count ?? 0] as const;
      })
    ),
    // Sem teto: fila de revisão truncada é trabalho parado invisível. A mais
    // antiga primeiro, que é a que espera há mais tempo.
    supabase
      .from("articles")
      .select(campos)
      .eq("status", "in_review")
      .order("updated_at", { ascending: true }),
    supabase
      .from("articles")
      .select(campos)
      .eq("status", "scheduled")
      .order("scheduled_for", { ascending: true }),
    supabase.from("articles").select(campos).order("updated_at", { ascending: false }).limit(8),
  ]);

  const contagem = Object.fromEntries(porEstado) as Record<EstadoEditorial, number>;
  const emRevisao = exigir(filaDeRevisao, "a fila de revisão");
  const agendadas = exigir(naFila, "as matérias agendadas");
  const recentes = exigir(ultimas, "as últimas matérias editadas");

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
                <Link
                  href={`/admin/materias/${m.id}`}
                  className="min-w-0 truncate text-sm text-ink hover:text-forest-700"
                >
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
          <Link
            href="/admin/materias"
            className="text-xs font-medium text-forest-700 hover:underline"
          >
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
                <Link
                  href={`/admin/materias/${m.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-ink hover:text-forest-700"
                >
                  {m.title}
                </Link>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${corDeEstado(m.status)}`}
                >
                  {rotuloDeEstado(m.status)}
                </span>
                <span className="w-32 shrink-0 truncate text-right text-[11px] text-ink-3">
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
