"use server";

import { randomUUID } from "node:crypto";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { requirePainel } from "@/lib/auth/session";
import { nomeNoBalde, problemaNoArquivo } from "@/lib/painel/upload";

const BALDE = "midia";

export interface EstadoDoEnvio {
  status: "inicial" | "enviando" | "enviado" | "erro";
  url?: string;
  mensagem?: string;
}

/**
 * Envia a capa da matéria.
 *
 * USA A CHAVE DE SERVIÇO, e a razão precisa ficar escrita: as políticas de
 * `storage.objects` são DDL, e este projeto não tem caminho automatizado para
 * aplicar DDL — foi exatamente uma dependência dessas que deixou o CMS
 * inoperante. Em vez de pedir que alguém cole SQL para o upload funcionar, a
 * autorização mora aqui: `requirePainel()` na primeira linha, e o que a ação
 * consegue fazer é estritamente gravar uma imagem validada em `midia/capas/`.
 *
 * O que a chave de serviço NÃO faz aqui: não lê nem escreve nenhuma tabela
 * além de `media_assets`, e não recebe caminho de fora — o nome no balde é
 * construído a partir de um UUID nosso.
 */
export async function enviarCapa(
  _estado: EstadoDoEnvio,
  dados: FormData
): Promise<EstadoDoEnvio> {
  const perfil = await requirePainel();

  const arquivo = dados.get("arquivo");
  const imagem = arquivo instanceof File ? arquivo : null;

  const problema = problemaNoArquivo(imagem);
  if (problema || !imagem) return { status: "erro", mensagem: problema ?? "Arquivo inválido." };

  // `media_assets.alt` é `not null` com pelo menos três caracteres, e a
  // restrição está no banco de propósito: imagem sem descrição desaparece
  // para quem usa leitor de tela.
  const alt = String(dados.get("alt") ?? "").trim();
  if (alt.length < 3) {
    return {
      status: "erro",
      mensagem: "Descreva a imagem em poucas palavras. É o que quem usa leitor de tela ouve.",
    };
  }

  const admin = criarClienteAdmin();
  const caminho = nomeNoBalde(imagem.name, imagem.type, randomUUID());

  const { error: erroEnvio } = await admin.storage
    .from(BALDE)
    .upload(caminho, imagem, { contentType: imagem.type, upsert: false });

  if (erroEnvio) {
    return { status: "erro", mensagem: `Não foi possível enviar: ${erroEnvio.message}` };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BALDE).getPublicUrl(caminho);

  // Registrar na biblioteca não é opcional: sem isso a imagem existe no balde
  // e não existe para a equipe, e a tela de Mídia mostraria um acervo falso.
  // Se falhar, o envio continua válido — o arquivo está lá e a matéria pode
  // usá-lo —, mas a pessoa fica sabendo.
  const { error: erroRegistro } = await admin.from("media_assets").insert({
    storage_path: caminho,
    alt,
    uploaded_by: perfil.id,
    bytes: imagem.size,
  });

  return {
    status: "enviado",
    url: publicUrl,
    mensagem: erroRegistro
      ? "Imagem enviada, mas não entrou na biblioteca de mídia. Avise quem administra."
      : "Imagem enviada.",
  };
}
