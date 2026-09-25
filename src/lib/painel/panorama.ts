import { ESTADOS_EDITORIAIS, estadoValido, type EstadoEditorial } from "./estados";

/**
 * O panorama editorial, calculado sobre linhas já carregadas.
 *
 * Sem I/O: a RLS já entregou ao colunista só o que é dele, e o painel apenas
 * conta o que veio. Nenhum `if` por papel mora aqui.
 *
 * O corpo da matéria NUNCA aparece nestes campos — `content`, `content_json`
 * e `content_text` estão revogadas de `authenticated`. `reading_time` é
 * granted e serve de sinal de "já foi salvo alguma vez".
 */
export interface LinhaDoPanorama {
  id: string;
  title: string;
  slug: string;
  status: string;
  updated_at: string;
  published_at: string | null;
  scheduled_for: string | null;
  category_id: number | null;
  cover_url: string | null;
  excerpt: string | null;
  reading_time: number | null;
  view_count: number | null;
  authors: { name: string | null } | null;
}

const DIA = 24 * 60 * 60 * 1000;

/** Dias sem toque a partir dos quais um rascunho conta como parado. */
export const DIAS_ATE_PARADO = 7;

/**
 * Agendadas cuja hora já passou.
 *
 * Este projeto não tem `pg_cron`: nada publica sozinho. Toda matéria
 * agendada fica agendada para sempre, e sem este bloco ela morre na fila sem
 * que ninguém perceba. É o aviso mais importante do painel enquanto o
 * agendamento automático não existir.
 */
export function agendadasAtrasadas(
  linhas: LinhaDoPanorama[],
  agora: Date
): LinhaDoPanorama[] {
  return linhas.filter(
    (l) =>
      l.status === "scheduled" &&
      l.scheduled_for !== null &&
      new Date(l.scheduled_for).getTime() <= agora.getTime()
  );
}

/**
 * Rascunhos esquecidos. Em revisão fica de fora: tem fila própria, e o que
 * espera lá espera por alguém, não por falta de atenção.
 */
export function rascunhosParados(
  linhas: LinhaDoPanorama[],
  agora: Date,
  dias = DIAS_ATE_PARADO
): LinhaDoPanorama[] {
  const limite = agora.getTime() - dias * DIA;
  return linhas
    .filter((l) => l.status === "draft" && new Date(l.updated_at).getTime() < limite)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
}

/**
 * Rascunhos que nasceram e nunca receberam texto.
 *
 * `reading_time` só é gravado no salvamento; nulo significa que ninguém
 * escreveu nada. São restos do fluxo antigo, em que clicar em "Nova matéria"
 * já criava a linha. Só rascunho entra: oferecer exclusão em massa de
 * matéria no ar seria um acidente à espera de acontecer.
 */
export function rascunhosVazios(linhas: LinhaDoPanorama[]): LinhaDoPanorama[] {
  return linhas.filter((l) => l.status === "draft" && l.reading_time === null);
}

/** Quantas saíram no ar nos últimos `dias`. */
export function publicadasDesde(
  linhas: LinhaDoPanorama[],
  agora: Date,
  dias: number
): number {
  const limite = agora.getTime() - dias * DIA;
  return linhas.filter((l) => {
    if (l.status !== "published" || !l.published_at) return false;
    const quando = new Date(l.published_at).getTime();
    return quando >= limite && quando <= agora.getTime();
  }).length;
}

/**
 * O que está errado numa matéria que JÁ ESTÁ NO AR.
 *
 * Só cobra publicada: rascunho ainda está sendo feito, e apontar o dedo para
 * quem está escrevendo é ruído. Endereço provisório é o mais grave — uma vez
 * indexado, corrigir quebra link.
 */
export function problemasDaPublicada(linha: LinhaDoPanorama): string[] {
  if (linha.status !== "published") return [];

  const problemas: string[] = [];
  const endereco = linha.slug.trim();
  if (endereco.length === 0) problemas.push("sem endereço");
  else if (endereco.startsWith("rascunho-") || endereco.startsWith("materia-")) {
    problemas.push("endereço provisório");
  }
  if (linha.category_id === null) problemas.push("sem editoria");
  if (!linha.cover_url?.trim()) problemas.push("sem capa");
  if (!linha.excerpt?.trim()) problemas.push("sem resumo");
  return problemas;
}

/**
 * Cobertura por editoria, incluindo as vazias.
 *
 * Editoria com zero matéria é o dado mais útil da lista — é o buraco da
 * cobertura. Omiti-la a tiraria da atenção de quem edita, que é o contrário
 * do que este bloco existe para fazer.
 */
export function porEditoria(
  linhas: LinhaDoPanorama[],
  categorias: Array<{ id: number; label: string }>
): Array<{ id: number; label: string; total: number }> {
  return categorias
    .map((c) => ({
      id: c.id,
      label: c.label,
      total: linhas.filter((l) => l.status === "published" && l.category_id === c.id).length,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "pt-BR"));
}

export function contarPorEstado(
  linhas: Array<{ status: string }>
): Record<EstadoEditorial, number> {
  const contagem = Object.fromEntries(ESTADOS_EDITORIAIS.map((e) => [e, 0])) as Record<
    EstadoEditorial,
    number
  >;
  for (const linha of linhas) {
    if (estadoValido(linha.status)) contagem[linha.status] += 1;
  }
  return contagem;
}
