/**
 * A capa de cada editoria.
 *
 * Imagem própria do projeto, reaproveitada. Não se gera fotografia por IA:
 * imagem sintética de um fato real é fabricar fotografia documental, que as
 * regras editoriais do veículo proíbem. Também não se usa foto de terceiro.
 *
 * Sem conjunto para a editoria, devolve nulo — a matéria fica sem
 * `cover_url` e o portal cai na imagem gerada pela semente do slug, que já
 * existe. O fallback vale SÓ nesse caso.
 *
 * Para editoria conhecida devolve `/capas/x.jpg`, e o portal não tem como
 * saber se o arquivo existe. Pré-condição de quem for consumir isto: os
 * arquivos de `public/capas/` precisam estar no projeto. Gravar o caminho em
 * `cover_url` antes disso põe 404 em toda matéria.
 */
const CAPAS = new Map<string, string>([
  ["mercado", "/capas/mercado.jpg"],
  ["tecnologia", "/capas/tecnologia.jpg"],
  ["politica", "/capas/politica.jpg"],
  ["regulacao", "/capas/regulacao.jpg"],
  ["saude", "/capas/saude.jpg"],
  ["auto", "/capas/auto.jpg"],
  ["vida", "/capas/vida.jpg"],
  ["agronegocio", "/capas/agronegocio.jpg"],
  ["cyber", "/capas/cyber.jpg"],
  ["beneficios", "/capas/beneficios.jpg"],
  ["resseguros", "/capas/resseguros.jpg"],
]);

/** `Map` e não objeto: busca literal responderia a `constructor` e `__proto__`. */
export function capaDaEditoria(editoria: string): string | null {
  return CAPAS.get(editoria) ?? null;
}
