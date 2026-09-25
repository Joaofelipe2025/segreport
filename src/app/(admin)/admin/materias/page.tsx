import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { Cartao, Vazio } from "@/components/admin/Painel";
import BuscaDeMaterias from "./BuscaDeMaterias";
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
import { nomeDoAutor } from "@/lib/painel/resumo";
import { problemasDaPublicada, type LinhaDoPanorama } from "@/lib/painel/panorama";

export const metadata: Metadata = { title: "Matérias" };

/**
 * Três estados no fluxo. Agendada e arquivada saíram: agendar nunca
 * funcionou sem pg_cron, e despublicar já devolve para rascunho.
 *
 * Elas continuam no banco, e linhas antigas continuam existindo — por isso
 * o filtro delas aparece quando há o que filtrar, em vez de sumir e deixar
 * matéria inalcançável pela interface.
 */
const FILTROS: Array<{ valor: "" | EstadoEditorial; rotulo: string }> = [
  { valor: "", rotulo: "Todas" },
  { valor: "draft", rotulo: "Rascunhos" },
  { valor: "in_review", rotulo: "Em revisão" },
  { valor: "published", rotulo: "Publicadas" },
];

const FILTROS_LEGADOS: Array<{ valor: EstadoEditorial; rotulo: string }> = [
  { valor: "scheduled", rotulo: "Agendadas" },
  { valor: "archived", rotulo: "Arquivadas" },
];

const CAMPOS =
  "id, title, slug, status, updated_at, published_at, scheduled_for, category_id, cover_url, excerpt, reading_time, view_count, authors(name)";

export default async function MateriasPage(props: PageProps<"/admin/materias">) {
  const params = await props.searchParams;
  const filtro = typeof params.estado === "string" ? params.estado : "";
  const busca = (typeof params.busca === "string" ? params.busca : "").trim();

  const perfil = await requirePainel();
  const supabase = await createClient();
  const agora = new Date();

  let consulta = supabase
    .from("articles")
    .select(CAMPOS)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (estadoValido(filtro)) consulta = consulta.eq("status", filtro);

  // Busca por título e por endereço. O corpo fica de fora porque
  // `content_text` está revogada de `authenticated` — quem procura por uma
  // frase do texto ainda precisa do Ctrl+F dentro da matéria. Está anotado
  // como limitação em vez de escondido atrás de um resultado vazio.
  if (busca) {
    const termo = busca.replace(/[%,()]/g, " ");
    consulta = consulta.or(`title.ilike.%${termo}%,slug.ilike.%${termo}%`);
  }

  const linhas = exigir(await consulta, "as matérias") as unknown as LinhaDoPanorama[];

  const emRevisao = linhas.filter((m) => m.status === "in_review");

  // Agendada e arquivada saíram do fluxo, mas linhas antigas existem. Sem
  // este filtro elas ficariam inalcançáveis pela interface.
  const legados = await supabase
    .from("articles")
    .select("status")
    .in("status", ["scheduled", "archived"]);
  const temLegado = new Set((legados.data ?? []).map((l) => l.status));
  const filtrando = Boolean(filtro || busca);

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

      {perfil.role === "admin" && emRevisao.length > 0 && !filtrando && (
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

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1 rounded-lg bg-forest-100 p-1">
          {[...FILTROS, ...FILTROS_LEGADOS.filter((f) => temLegado.has(f.valor))].map((f) => {
            const ativo = f.valor === filtro;
            const destino = new URLSearchParams();
            if (f.valor) destino.set("estado", f.valor);
            if (busca) destino.set("busca", busca);
            const qs = destino.toString();

            return (
              <Link
                key={f.valor || "todas"}
                href={qs ? `/admin/materias?${qs}` : "/admin/materias"}
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

        <BuscaDeMaterias busca={busca} estado={filtro} />
      </div>

      {linhas.length === 0 ? (
        <Vazio>
          {busca ? (
            <>
              Nada encontrado para <strong className="font-semibold text-ink-2">{busca}</strong>.
              <br />
              <span className="text-ink-4">
                A busca olha título e endereço. O texto da matéria não é
                pesquisável daqui — a coluna está fechada para o paywall.
              </span>
            </>
          ) : filtro ? (
            "Nenhuma matéria neste estado."
          ) : (
            <>
              Nenhuma matéria ainda.{" "}
              <Link href="/admin/materias/nova" className="text-forest-700 hover:underline">
                Escreva a primeira.
              </Link>
            </>
          )}
        </Vazio>
      ) : (
        <Cartao className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {linhas.map((m) => {
              const problemas = problemasDaPublicada(m);
              return (
                <li key={m.id}>
                  <Link
                    href={`/admin/materias/${m.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 transition-colors hover:bg-paper"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {m.title}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-[11px] text-ink-4">/{m.slug}</span>
                        {problemas.map((p) => (
                          <span
                            key={p}
                            className="rounded bg-[#fdf3f3] px-1.5 py-0.5 text-[10px] font-medium text-[#a5252a]"
                          >
                            {p}
                          </span>
                        ))}
                      </span>
                    </span>

                    <span className="shrink-0 text-xs text-ink-3">{nomeDoAutor(m)}</span>

                    <span
                      className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${corDeEstado(m.status)}`}
                    >
                      {rotuloDeEstado(m.status)}
                    </span>

                    <span className="w-24 shrink-0 text-right text-[11px] text-ink-4">
                      {formatRelative(m.updated_at, agora)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}

      {linhas.length >= 200 && (
        <p className="mt-3 text-center text-[11px] text-ink-4">
          Mostrando as 200 mais recentes. Use a busca ou um filtro para chegar
          às outras.
        </p>
      )}
    </>
  );
}
