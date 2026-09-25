import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { exigir } from "@/lib/painel/consulta";
import { ESTADOS_EDITORIAIS, rotuloDeEstado } from "@/lib/painel/estados";
import FormularioDeAssinatura from "./FormularioDeAssinatura";

export const metadata: Metadata = { title: "Ajustes" };

const UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

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

  // Diagnóstico: responde "o banco está com as migrações certas?" sem abrir o
  // Supabase. É a pergunta que apareceu toda vez que algo quebrou aqui.
  const ehAdmin = perfil.role === "admin";
  let diagnostico: Array<{ nome: string; valor: string; ok: boolean }> = [];

  if (ehAdmin) {
    const categorias = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });

    const contagens = await Promise.all(
      ESTADOS_EDITORIAIS.map(async (estado) => {
        const r = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", estado);
        return `${rotuloDeEstado(estado)}: ${r.count ?? 0}`;
      })
    );

    // Sonda barata: um id que não existe. Só interessa se a função responde
    // — se ela sumir, o editor não abre matéria nenhuma.
    const sonda = await supabase.rpc("article_body_for_edit", { p_id: UUID_INEXISTENTE });

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
      <PageHeader titulo="Ajustes" descricao="Sua assinatura pública e o estado do sistema." />

      <div className="max-w-xl space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Sua assinatura</h2>
          {autor ? (
            <FormularioDeAssinatura
              nome={autor.name ?? ""}
              bio={autor.bio ?? ""}
              slug={autor.slug ?? ""}
            />
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
            <Linha
              rotulo="Papel"
              valor={perfil.role === "admin" ? "Administrador" : "Colunista"}
            />
            <Linha
              rotulo="Endereço público"
              valor={autor?.slug ? `/colunistas/${autor.slug}` : "—"}
            />
            {/* O suporte pergunta por ele quando algo não bate. */}
            <Linha rotulo="Identificador do autor" valor={autor?.id ?? "—"} />
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
                  <dd
                    className={`min-w-0 flex-1 break-words text-xs ${d.ok ? "text-ink-2" : "text-down"}`}
                  >
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
