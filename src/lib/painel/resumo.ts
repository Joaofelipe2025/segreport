/**
 * `authors(name)` volta nulo quando o autor foi apagado ou o vínculo sumiu.
 * A listagem precisa continuar de pé — e "Sem assinatura" é informação útil
 * para quem administra, não só um espaço em branco.
 */
export function nomeDoAutor(linha: { authors: { name: string | null } | null }): string {
  return linha.authors?.name?.trim() || "Sem assinatura";
}
