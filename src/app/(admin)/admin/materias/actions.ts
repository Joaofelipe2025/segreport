"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePainel, requireRole } from "@/lib/auth/session";
import { slugDeNome } from "@/lib/auth/rules";
import { pendenciasParaPublicar } from "@/lib/painel/publicacao";
import { haConflito } from "@/lib/painel/consulta";
import {
  extrairTexto,
  tempoDeLeitura,
  type DocumentoBlocos,
} from "@/lib/editor/document";

export interface EstadoMateria {
  status: "inicial" | "salvo" | "erro" | "conflito";
  mensagem?: string;
  /** Devolvido no salvamento para a próxima gravação detectar conflito. */
  updatedAt?: string;
}

/** Estados que o colunista pode gravar. A RLS é quem realmente impede. */
const ESTADOS_DO_COLUNISTA = new Set(["draft", "in_review"]);

/**
 * Cria a matéria no PRIMEIRO salvamento, não no clique do botão.
 *
 * Antes, "Nova matéria" era um formulário que gravava uma linha na hora:
 * `Matéria sem título`, slug `rascunho-<relógio>`, corpo vazio. Quando o
 * editor não abria — e ele não abriu — sobrava lixo no banco. Cinco linhas
 * assim se acumularam antes de alguém perceber.
 *
 * Botão de navegação não deve escrever no banco. Agora `/admin/materias/nova`
 * é só uma tela; a linha nasce quando existe um título de verdade.
 */
async function criarMateriaNova(
  perfil: { id: string; authorId: string | null },
  campos: CamposDaMateria,
  doc: DocumentoBlocos
): Promise<EstadoMateria> {
  if (!perfil.authorId) {
    return {
      status: "erro",
      mensagem:
        "Sua conta não tem assinatura pública, então não dá para assinar uma matéria. Peça ao administrador para criar o autor e vincular ao seu perfil.",
    };
  }

  const supabase = await createClient();

  // O endereço sai do título. Se colidir, o banco recusa pela restrição de
  // unicidade e a pessoa recebe o motivo — melhor do que inventar um sufixo
  // e deixá-la publicar com uma URL que ninguém escolheu.
  const slug = campos.slug || slugDeNome(campos.titulo);

  const { data, error } = await supabase
    .from("articles")
    .insert({
      slug,
      title: campos.titulo,
      standfirst: campos.standfirst,
      status: "draft",
      author_id: perfil.authorId,
      category_id: campos.categoryId,
      seo_title: campos.seoTitle,
      seo_description: campos.seoDescription,
      cover_url: campos.coverUrl,
      excerpt: campos.excerpt,
      content_json: doc as never,
      content_text: extrairTexto(doc),
      reading_time: tempoDeLeitura(doc),
      updated_by: perfil.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    const duplicado = error?.code === "23505";
    return {
      status: "erro",
      mensagem: duplicado
        ? `Já existe uma matéria no endereço /${slug}. Mude o título ou o endereço no trilho à direita.`
        : `Não foi possível criar a matéria: ${error?.message ?? "erro desconhecido"}`,
    };
  }

  revalidatePath("/admin/materias");
  redirect(`/admin/materias/${data.id}`);
}

interface CamposDaMateria {
  titulo: string;
  standfirst: string | null;
  slug: string;
  categoryId: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  coverUrl: string | null;
  excerpt: string | null;
}

export async function salvarMateria(
  _estado: EstadoMateria,
  dados: FormData
): Promise<EstadoMateria> {
  const perfil = await requirePainel();
  const supabase = await createClient();

  const id = String(dados.get("id") ?? "");
  const titulo = String(dados.get("title") ?? "").trim();
  const standfirst = String(dados.get("standfirst") ?? "").trim();
  const slugBruto = String(dados.get("slug") ?? "").trim();
  const categoria = String(dados.get("category_id") ?? "");
  const seoTitle = String(dados.get("seo_title") ?? "").trim();
  const seoDescription = String(dados.get("seo_description") ?? "").trim();
  const capa = String(dados.get("cover_url") ?? "").trim();
  const resumo = String(dados.get("excerpt") ?? "").trim();
  const updatedAtCliente = String(dados.get("updated_at") ?? "");
  const docBruto = String(dados.get("content_json") ?? "");

  if (titulo.length < 3) {
    return {
      status: "erro",
      mensagem: id
        ? "O título precisa de pelo menos três caracteres."
        : "Dê um título à matéria para começar — ele precisa de pelo menos três caracteres.",
    };
  }

  let doc: DocumentoBlocos;
  try {
    doc = JSON.parse(docBruto) as DocumentoBlocos;
  } catch {
    return { status: "erro", mensagem: "O corpo da matéria chegou corrompido. Recarregue e tente de novo." };
  }

  const campos: CamposDaMateria = {
    titulo,
    standfirst: standfirst || null,
    slug: slugBruto ? slugDeNome(slugBruto) : "",
    categoryId: categoria ? Number(categoria) : null,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    coverUrl: capa || null,
    excerpt: resumo || null,
  };

  // Sem id, a matéria ainda não existe: este é o primeiro salvamento, e é
  // aqui que a linha nasce.
  if (!id) return criarMateriaNova(perfil, campos, doc);

  // Conflito de edição simultânea: o carimbo viaja com o formulário. Se mudou
  // no servidor, alguém salvou no meio. Recusamos em vez de mesclar — em
  // texto editorial, mesclar às cegas é pior que avisar.
  if (updatedAtCliente) {
    const { data: atual, error: erroCarimbo } = await supabase
      .from("articles")
      .select("updated_at")
      .eq("id", id)
      .maybeSingle();

    // `haConflito` falha fechada: se não deu para ler o carimbo, recusa. A
    // versão anterior deixava passar, e a proteção contra edição simultânea
    // se desligava sozinha exatamente quando deveria proteger.
    if (haConflito(updatedAtCliente, atual?.updated_at ?? null, erroCarimbo)) {
      return {
        status: "conflito",
        mensagem: erroCarimbo
          ? `Não deu para confirmar se alguém alterou esta matéria (${erroCarimbo.message}). Não gravamos, para não passar por cima do texto de outra pessoa. Tente de novo — seu texto continua aqui na tela.`
          : "Esta matéria foi alterada por outra pessoa desde que você abriu. Recarregue para ver a versão atual — seu texto continua aqui na tela.",
      };
    }
  }

  const { data, error } = await supabase
    .from("articles")
    .update({
      title: titulo,
      standfirst: standfirst || null,
      slug: slugBruto ? slugDeNome(slugBruto) : undefined,
      category_id: categoria ? Number(categoria) : null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      cover_url: capa || null,
      excerpt: resumo || null,
      content_json: doc as never,
      // Derivado no salvamento, não em gatilho: quem sabe percorrer o
      // documento é o mesmo código que define os tipos de bloco.
      content_text: extrairTexto(doc),
      reading_time: tempoDeLeitura(doc),
      updated_by: perfil.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("updated_at")
    .single();

  if (error) {
    return { status: "erro", mensagem: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath(`/admin/materias/${id}`);
  return { status: "salvo", mensagem: "Salvo.", updatedAt: data?.updated_at };
}

/**
 * Muda o estado da matéria.
 *
 * A interface só oferece as transições permitidas, mas quem impede é a RLS:
 * o colunista não consegue gravar 'published' nem 'scheduled' nem chamando a
 * API diretamente.
 */
export async function mudarEstado(
  id: string,
  novoEstado: string,
  agendadoPara?: string
): Promise<EstadoMateria> {
  const perfil = await requirePainel();

  if (perfil.role === "columnist" && !ESTADOS_DO_COLUNISTA.has(novoEstado)) {
    return { status: "erro", mensagem: "Publicar é do administrador." };
  }
  if (novoEstado === "scheduled" && !agendadoPara) {
    return { status: "erro", mensagem: "Informe a data e a hora do agendamento." };
  }

  const supabase = await createClient();

  // Portão de publicação. Confere o que está NO BANCO, não o que o formulário
  // disse: entre o último Salvar e o clique em Publicar pode não ter havido
  // salvamento nenhum.
  if (novoEstado === "published" || novoEstado === "scheduled") {
    const { data: linha, error: erroLinha } = await supabase
      .from("articles")
      .select("title, category_id, slug")
      .eq("id", id)
      .maybeSingle();

    if (erroLinha || !linha) {
      return {
        status: "erro",
        mensagem: `Não foi possível conferir a matéria: ${erroLinha?.message ?? "não encontrada"}`,
      };
    }

    // O corpo vem pela função: a coluna está revogada de `authenticated`.
    //
    // O erro precisa ser olhado. Descartá-lo faria corpo nulo por FALHA ficar
    // indistinguível de corpo nulo por AUSÊNCIA, e o portão diria "escreva o
    // corpo da matéria" a quem já escreveu novecentas palavras — mandando a
    // pessoa reescrever o que está gravado.
    const { data: corpo, error: erroCorpo } = await supabase.rpc("article_body_json", {
      p_slug: linha.slug ?? "",
    });

    if (erroCorpo) {
      return {
        status: "erro",
        mensagem: `Não foi possível ler o corpo para conferir antes de publicar: ${erroCorpo.message}`,
      };
    }

    const faltas = pendenciasParaPublicar({
      title: linha.title ?? "",
      category_id: linha.category_id,
      slug: linha.slug ?? "",
      corpo: corpo as unknown as DocumentoBlocos | null,
    });

    if (faltas.length > 0) {
      return { status: "erro", mensagem: `Antes de publicar: ${faltas.join("; ")}.` };
    }
  }

  const { error } = await supabase
    .from("articles")
    .update({
      status: novoEstado as never,
      scheduled_for: novoEstado === "scheduled" ? agendadoPara! : null,
      published_at: novoEstado === "published" ? new Date().toISOString() : undefined,
      updated_by: perfil.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { status: "erro", mensagem: `Não foi possível mudar o estado: ${error.message}` };
  }

  revalidatePath("/admin/materias");
  revalidatePath(`/admin/materias/${id}`);
  return { status: "salvo", mensagem: "Estado atualizado." };
}

/**
 * Exclui a matéria, ou explica por que não excluiu.
 *
 * O `.select()` não é enfeite: sem ele não há como distinguir "apagou" de
 * "a RLS recusou em silêncio". A versão anterior descartava tudo e
 * redirecionava — o admin digitava o título inteiro para confirmar uma ação
 * sem volta e voltava para a listagem com a matéria ainda lá, sem explicação.
 */
export async function excluirMateria(id: string): Promise<EstadoMateria> {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase.from("articles").delete().eq("id", id).select("id");

  if (error) {
    return { status: "erro", mensagem: `Não foi possível excluir: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return {
      status: "erro",
      mensagem:
        "Nada foi excluído. A matéria já não existe, ou o banco recusou a exclusão — nada mudou.",
    };
  }

  revalidatePath("/admin/materias");
  redirect("/admin/materias");
}
