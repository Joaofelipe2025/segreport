import { ESTADOS_EDITORIAIS, estadoValido, type EstadoEditorial } from "./estados";

/**
 * Contas do painel inicial, sobre linhas já carregadas.
 *
 * Sem I/O de propósito: quem filtra por autor é a RLS, e o painel apenas
 * conta o que voltou. O colunista vê os números dele sem nenhum `if` no
 * código — o banco já entregou só o que é dele.
 */
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

/**
 * `authors(name)` volta nulo quando o autor foi apagado ou o vínculo sumiu.
 * A listagem precisa continuar de pé — e "Sem assinatura" é informação útil
 * para quem administra, não só um espaço em branco.
 */
export function nomeDoAutor(linha: { authors: { name: string | null } | null }): string {
  return linha.authors?.name?.trim() || "Sem assinatura";
}
