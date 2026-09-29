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

export default async function PautasPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const agora = new Date();

  const [lista, ultima] = await Promise.all([
    supabase
      .from("pautas")
      .select("id, fonte, titulo, url, resumo, publicado_em, estado, criado_em")
      .eq("estado", "nova")
      .order("publicado_em", { ascending: false, nullsFirst: false })
      .limit(200),
    supabase
      .from("vigia_execucoes")
      .select("comecou_em, achados, falhas")
      .order("comecou_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const pautas = pautasVisiveis(exigir(lista, "as pautas"), agora);
  const execucao = exigir(ultima, "a última execução do vigia");
  const estado = resumoDaExecucao(execucao, agora);

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
