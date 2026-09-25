import type { Metadata } from "next";
import PageHeader from "@/components/admin/PageHeader";
import { Cartao, Secao, Vazio } from "@/components/admin/Painel";
import { requirePainel } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { exigir } from "@/lib/painel/consulta";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Mídia" };

/**
 * Biblioteca de mídia.
 *
 * O envio de arquivo ainda não existe — depende do Storage do Supabase, que é
 * um sub-projeto próprio. O que esta tela faz hoje é mostrar o que JÁ está na
 * tabela `media_assets` e dizer, com precisão, o que falta e por quê.
 *
 * A alternativa era continuar com um retângulo pontilhado dizendo "entra no
 * próximo plano", que não informa nada e parece abandono.
 */
export default async function MidiaPage() {
  await requirePainel();
  const supabase = await createClient();
  const agora = new Date();

  const arquivos = exigir(
    await supabase
      .from("media_assets")
      .select("id, storage_path, alt, credit, width, height, created_at")
      .order("created_at", { ascending: false })
      .limit(60),
    "a biblioteca de mídia"
  );

  return (
    <>
      <PageHeader
        titulo="Mídia"
        descricao="Biblioteca compartilhada da equipe. Toda imagem exige texto alternativo."
      />

      <div className="mb-6 rounded-xl border border-hairline bg-paper p-5">
        <h2 className="text-sm font-semibold text-ink">O envio ainda não está ligado</h2>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-3">
          A tabela existe e a regra de acesso está posta — texto alternativo é
          obrigatório no banco, com pelo menos três caracteres, porque imagem
          sem descrição some para quem usa leitor de tela. O que falta é o
          balde do Supabase Storage e a tela de envio. Até lá, as capas das
          matérias precisam apontar para uma URL já hospedada.
        </p>
      </div>

      <Secao titulo="No acervo" contagem={arquivos.length}>
        {arquivos.length === 0 ? (
          <Vazio>
            Nenhum arquivo cadastrado ainda. Quando o envio entrar, o que for
            subido aparece aqui para toda a equipe reutilizar.
          </Vazio>
        ) : (
          <Cartao>
            <ul className="divide-y divide-hairline">
              {arquivos.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{a.alt}</span>
                    <span className="block truncate font-mono text-[11px] text-ink-4">
                      {a.storage_path}
                      {a.credit ? ` · ${a.credit}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-3">
                    {a.width && a.height ? `${a.width}×${a.height}` : "—"}
                  </span>
                  <span className="w-20 shrink-0 text-right text-[11px] text-ink-4">
                    {formatRelative(a.created_at, agora)}
                  </span>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
      </Secao>
    </>
  );
}
