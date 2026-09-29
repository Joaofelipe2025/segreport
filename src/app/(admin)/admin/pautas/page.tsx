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

const VINTE_QUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

export default async function PautasPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const agora = new Date();

  const [lista, ultima] = await Promise.all([
    supabase
      .from("pautas")
      .select("id, fonte, titulo, url, resumo, publicado_em, estado, criado_em")
      .eq("estado", "nova")
      // Ordena por `criado_em` porque é por `criado_em` que `pautasVisiveis`
      // corta a janela de sete dias. Ordenar por `publicado_em` desalinha as
      // duas: pauta vista hoje, mas sem data no feed, iria para o fim da fila
      // e sumiria no `.limit(200)` — justo a mais nova, e sem erro nenhum na
      // tela. Assim o corte derruba as mais velhas, que a janela já esconde.
      .order("criado_em", { ascending: false })
      .limit(200),
    supabase
      .from("vigia_execucoes")
      .select("comecou_em, achados, falhas")
      .order("comecou_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const listaBruta = exigir(lista, "as pautas");
  const pautas = pautasVisiveis(listaBruta, agora);
  // Derivada da mesma consulta acima, sem round-trip extra ao banco. É uma
  // aproximação por só cobrir pautas ainda `nova` (a consulta já filtra por
  // isso) — mas cobre o caso que importa: se uma pauta que entrou hoje já
  // foi triada pelo dono, o dia obviamente não está em silêncio.
  const pautasUltimas24h = listaBruta.filter(
    (p) => agora.getTime() - new Date(p.criado_em).getTime() < VINTE_QUATRO_HORAS_MS
  ).length;
  const execucao = exigir(ultima, "a última execução do vigia");
  const estado = resumoDaExecucao(execucao, agora, pautasUltimas24h);

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
