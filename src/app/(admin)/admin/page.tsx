import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import {
  Aviso,
  Cartao,
  LinhaDeMateria,
  Numero,
  Secao,
  Vazio,
} from "@/components/admin/Painel";
import LimparRascunhosVazios from "./LimparRascunhosVazios";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { exigir } from "@/lib/painel/consulta";
import { corDeEstado, rotuloDeEstado } from "@/lib/painel/estados";
import { ESTADOS_DO_FLUXO } from "@/lib/painel/fluxo";
import { nomeDoAutor } from "@/lib/painel/resumo";
import {
  DIAS_ATE_PARADO,
  agendadasAtrasadas,
  contarPorEstado,
  porEditoria,
  problemasDaPublicada,
  publicadasDesde,
  rascunhosParados,
  rascunhosVazios,
  type LinhaDoPanorama,
} from "@/lib/painel/panorama";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Painel" };

const CAMPOS =
  "id, title, slug, status, updated_at, published_at, scheduled_for, category_id, cover_url, excerpt, reading_time, view_count, authors(name)";

export default async function PainelInicial() {
  const perfil = await requirePainel();
  const supabase = await createClient();
  const agora = new Date();

  // Consultas dirigidas, nunca a tabela inteira.
  //
  // Uma versão anterior lia tudo e fatiava em memória. Parece simples e
  // mente: o PostgREST corta a resposta no `max-rows` do projeto (1000 por
  // padrão) e devolve 200 com o corpo truncado — sem erro, sem aviso, e
  // `exigir()` deixa passar. A partir daí os contadores viram ficção, e como
  // a ordem é por `updated_at`, o primeiro a sumir é o que está parado há
  // mais tempo: exatamente o que este painel existe para mostrar.
  const contagens = supabase.from("articles").select("status");
  const filaDeRevisao = supabase
    .from("articles")
    .select(CAMPOS)
    .eq("status", "in_review")
    .order("updated_at", { ascending: true });
  const agendadas = supabase
    .from("articles")
    .select(CAMPOS)
    .eq("status", "scheduled")
    .order("scheduled_for", { ascending: true });
  const publicadas = supabase
    .from("articles")
    .select(CAMPOS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  const rascunhos = supabase
    .from("articles")
    .select(CAMPOS)
    .eq("status", "draft")
    .order("updated_at", { ascending: true });
  const ultimas = supabase
    .from("articles")
    .select(CAMPOS)
    .order("updated_at", { ascending: false })
    .limit(8);

  const [
    porStatus,
    listaEmRevisao,
    listaAgendadas,
    listaPublicadas,
    listaRascunhos,
    listaUltimas,
    listaDeCategorias,
  ] = await Promise.all([
    contagens,
    filaDeRevisao,
    agendadas,
    publicadas,
    rascunhos,
    ultimas,
    supabase.from("categories").select("id, label").order("label"),
  ]);

  const como = (r: Awaited<typeof filaDeRevisao>, oQue: string) =>
    exigir(r, oQue) as unknown as LinhaDoPanorama[];

  const contagem = contarPorEstado(exigir(porStatus, "as contagens do painel"));
  const emRevisao = como(listaEmRevisao, "a fila de revisão");
  const listaDePublicadas = como(listaPublicadas, "as matérias publicadas");
  const recentes = como(listaUltimas, "as últimas matérias editadas");
  const categorias = exigir(listaDeCategorias, "as editorias");

  const atrasadas = agendadasAtrasadas(como(listaAgendadas, "as matérias agendadas"), agora);
  const todosOsRascunhos = como(listaRascunhos, "os rascunhos");
  const paradas = rascunhosParados(todosOsRascunhos, agora);
  const vazias = rascunhosVazios(todosOsRascunhos);

  const comProblema = listaDePublicadas
    .map((l) => ({ linha: l, problemas: problemasDaPublicada(l) }))
    .filter((x) => x.problemas.length > 0);
  const maisLidas = [...listaDePublicadas]
    .filter((l) => (l.view_count ?? 0) > 0)
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 5);
  const ehAdmin = perfil.role === "admin";

  return (
    <>
      <PageHeader
        titulo="Painel"
        descricao={
          perfil.role === "columnist"
            ? "O estado das suas colunas."
            : "O estado da redação agora."
        }
        acao={
          <Link
            href="/admin/materias/nova"
            className="rounded-lg bg-forest-800 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-700"
          >
            + Nova matéria
          </Link>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Primeiro o que está quebrado, depois o que espera alguém, depois  */}
      {/* os números. Número não pede ação; fila e falha pedem.             */}
      {/* ---------------------------------------------------------------- */}

      {atrasadas.length > 0 && (
        <Aviso
          tom="alerta"
          titulo={
            atrasadas.length === 1
              ? "1 matéria ficou presa em agendamento"
              : `${atrasadas.length} matérias ficaram presas em agendamento`
          }
        >
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed">
            O agendamento saiu do fluxo: ele nunca publicou nada sozinho, porque
            este projeto não tem <code>pg_cron</code>. Estas são as que ficaram
            para trás. Abra cada uma e publique, ou traga de volta para
            rascunho — não há mais como agendar novas.
          </p>
          <ul className="mt-3 divide-y divide-[#f0cdcd]">
            {atrasadas.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/materias/${m.id}`}
                  className="flex items-baseline justify-between gap-4 py-2 hover:underline"
                >
                  <span className="min-w-0 truncate text-sm">{m.title}</span>
                  <span className="shrink-0 text-[11px]">
                    era para sair {m.scheduled_for ? formatRelative(m.scheduled_for, agora) : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Aviso>
      )}

      {emRevisao.length > 0 && (
        <Aviso
          titulo={
            emRevisao.length === 1
              ? "1 matéria esperando revisão"
              : `${emRevisao.length} matérias esperando revisão`
          }
        >
          <ul className="mt-3 divide-y divide-[#efe5c4]">
            {emRevisao.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/materias/${m.id}`}
                  className="flex items-baseline justify-between gap-4 py-2 hover:underline"
                >
                  <span className="min-w-0 truncate text-sm">{m.title}</span>
                  <span className="shrink-0 text-[11px]">
                    {nomeDoAutor(m)} · parada {formatRelative(m.updated_at, agora)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Aviso>
      )}

      <Secao titulo="Como está o acervo">
        {/* Três estados, mais o ritmo da semana. Agendada e arquivada só
            aparecem se houver o que mostrar: elas saíram do fluxo, mas linhas
            antigas não somem por decreto. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Numero
            valor={publicadasDesde(listaDePublicadas, agora, 7)}
            rotulo="últimos 7 dias"
            destaque="bg-forest-100 text-forest-700"
          />
          {[
            ...ESTADOS_DO_FLUXO,
            ...(["scheduled", "archived"] as const).filter((e) => contagem[e] > 0),
          ].map((estado) => (
            <Numero
              key={estado}
              valor={contagem[estado]}
              rotulo={rotuloDeEstado(estado)}
              href={`/admin/materias?estado=${estado}`}
              destaque={corDeEstado(estado)}
            />
          ))}
        </div>
      </Secao>

      {comProblema.length > 0 && (
        <Secao
          titulo="No ar, mas incompleta"
          contagem={comProblema.length}
          aoLado={
            <span className="text-[11px] text-ink-4">
              O leitor já vê estas matérias assim
            </span>
          }
        >
          <Cartao>
            <ul className="divide-y divide-hairline">
              {comProblema.slice(0, 8).map(({ linha, problemas }) => (
                <LinhaDeMateria
                  key={linha.id}
                  href={`/admin/materias/${linha.id}`}
                  titulo={linha.title}
                  etiqueta={
                    <span className="flex flex-wrap gap-1">
                      {problemas.map((p) => (
                        <span
                          key={p}
                          className="rounded bg-[#fdf3f3] px-1.5 py-0.5 text-[10px] font-medium text-[#a5252a]"
                        >
                          {p}
                        </span>
                      ))}
                    </span>
                  }
                />
              ))}
            </ul>
          </Cartao>
        </Secao>
      )}

      {paradas.length > 0 && (
        <Secao
          titulo="Rascunhos parados"
          contagem={paradas.length}
          aoLado={
            <span className="text-[11px] text-ink-4">
              Sem alteração há mais de {DIAS_ATE_PARADO} dias
            </span>
          }
        >
          <Cartao>
            <ul className="divide-y divide-hairline">
              {paradas.slice(0, 6).map((m) => (
                <LinhaDeMateria
                  key={m.id}
                  href={`/admin/materias/${m.id}`}
                  titulo={m.title}
                  direita={`${nomeDoAutor(m)} · ${formatRelative(m.updated_at, agora)}`}
                />
              ))}
            </ul>
          </Cartao>
        </Secao>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Secao titulo="Cobertura por editoria">
          <Cartao className="p-4">
            <CoberturaPorEditoria itens={porEditoria(listaDePublicadas, categorias)} />
          </Cartao>
        </Secao>

        <Secao titulo="Mais lidas">
          {maisLidas.length === 0 ? (
            <Vazio>
              Ainda não há leituras registradas. A contagem começa quando as
              matérias publicadas receberem visitas.
            </Vazio>
          ) : (
            <Cartao>
              <ul className="divide-y divide-hairline">
                {maisLidas.map((m) => (
                  <LinhaDeMateria
                    key={m.id}
                    href={`/admin/materias/${m.id}`}
                    titulo={m.title}
                    direita={`${(m.view_count ?? 0).toLocaleString("pt-BR")} leituras`}
                  />
                ))}
              </ul>
            </Cartao>
          )}
        </Secao>
      </div>

      <Secao
        titulo="Editadas por último"
        aoLado={
          <Link
            href="/admin/materias"
            className="text-xs font-medium text-forest-700 hover:underline"
          >
            Ver todas
          </Link>
        }
      >
        {recentes.length === 0 ? (
          <Vazio>
            Nenhuma matéria ainda.{" "}
            <Link href="/admin/materias/nova" className="text-forest-700 hover:underline">
              Escreva a primeira.
            </Link>
          </Vazio>
        ) : (
          <Cartao>
            <ul className="divide-y divide-hairline">
              {recentes.map((m) => (
                <LinhaDeMateria
                  key={m.id}
                  href={`/admin/materias/${m.id}`}
                  titulo={m.title}
                  etiqueta={
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${corDeEstado(m.status)}`}
                    >
                      {rotuloDeEstado(m.status)}
                    </span>
                  }
                  direita={`${nomeDoAutor(m)} · ${formatRelative(m.updated_at, agora)}`}
                />
              ))}
            </ul>
          </Cartao>
        )}
      </Secao>

      {ehAdmin && vazias.length > 0 && (
        <Secao titulo="Limpeza" contagem={vazias.length}>
          <LimparRascunhosVazios
            rascunhos={vazias.map((m) => ({ id: m.id, slug: m.slug, title: m.title }))}
          />
        </Secao>
      )}
    </>
  );
}

/**
 * Barras de cobertura.
 *
 * A editoria vazia fica na lista, com a barra em zero: o buraco da cobertura
 * é o dado mais útil aqui, e escondê-lo o tiraria da atenção de quem edita.
 */
function CoberturaPorEditoria({
  itens,
}: {
  itens: Array<{ id: number; label: string; total: number }>;
}) {
  const maior = Math.max(1, ...itens.map((i) => i.total));

  return (
    <ul className="space-y-2">
      {itens.map((i) => (
        <li key={i.id} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-ink-2">{i.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
            <span
              className={`block h-full rounded-full ${i.total === 0 ? "" : "bg-forest-500"}`}
              style={{ width: `${(i.total / maior) * 100}%` }}
            />
          </span>
          <span
            className={`w-6 shrink-0 text-right text-xs tabular-nums ${i.total === 0 ? "text-ink-4" : "text-ink-2"}`}
          >
            {i.total}
          </span>
        </li>
      ))}
    </ul>
  );
}
