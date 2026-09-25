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
import { ESTADOS_EDITORIAIS, corDeEstado, rotuloDeEstado } from "@/lib/painel/estados";
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

  // Uma consulta só, sem corpo de matéria: a RLS já limita o colunista ao que
  // é dele, e todo o resto é conta feita em memória sobre estas linhas.
  const [todas, listaDeCategorias] = await Promise.all([
    supabase.from("articles").select(CAMPOS).order("updated_at", { ascending: false }),
    supabase.from("categories").select("id, label").order("label"),
  ]);

  const linhas = exigir(todas, "o panorama das matérias") as unknown as LinhaDoPanorama[];
  const categorias = exigir(listaDeCategorias, "as editorias");

  const contagem = contarPorEstado(linhas);
  const emRevisao = linhas
    .filter((l) => l.status === "in_review")
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  const atrasadas = agendadasAtrasadas(linhas, agora);
  const paradas = rascunhosParados(linhas, agora);
  const vazias = rascunhosVazios(linhas);
  const comProblema = linhas
    .map((l) => ({ linha: l, problemas: problemasDaPublicada(l) }))
    .filter((x) => x.problemas.length > 0);
  const maisLidas = linhas
    .filter((l) => l.status === "published" && (l.view_count ?? 0) > 0)
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 5);
  const recentes = linhas.slice(0, 8);
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
              ? "1 matéria agendada passou da hora e não foi publicada"
              : `${atrasadas.length} matérias agendadas passaram da hora e não foram publicadas`
          }
        >
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed">
            Este projeto ainda não tem publicação automática — nada sai do ar
            para o ar sozinho. Até o agendamento por <code>pg_cron</code>{" "}
            existir, agendar é só um lembrete: alguém precisa abrir e publicar.
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
                    era para {m.scheduled_for ? formatRelative(m.scheduled_for, agora) : "—"}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Numero
            valor={publicadasDesde(linhas, agora, 7)}
            rotulo="últimos 7 dias"
            destaque="bg-forest-100 text-forest-700"
          />
          {ESTADOS_EDITORIAIS.map((estado) => (
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
            <CoberturaPorEditoria itens={porEditoria(linhas, categorias)} />
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
