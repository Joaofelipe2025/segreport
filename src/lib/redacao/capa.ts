/**
 * A capa de cada editoria.
 *
 * Imagem própria do projeto, reaproveitada. Não se gera fotografia por IA:
 * imagem sintética de um fato real é fabricar fotografia documental, que as
 * regras editoriais do veículo proíbem. Também não se usa foto de terceiro.
 *
 * O mapa está VAZIO de propósito. Os caminhos (`/capas/x.jpg`) entram junto
 * com os arquivos de `public/capas/`, na etapa 4 — nunca antes. O portal não
 * tem como saber se o arquivo existe: gravar o caminho em `cover_url` antes
 * disso põe capa 404 em toda matéria, e quem descobre é o dono. Comentário
 * não é portão; mapa vazio é.
 *
 * Sem caminho para a editoria, devolve nulo — a matéria fica sem `cover_url`
 * e o portal cai na imagem gerada pela semente do slug, que já existe.
 */
const CAPAS = new Map<string, string>();

/** `Map` e não objeto: busca literal responderia a `constructor` e `__proto__`. */
export function capaDaEditoria(editoria: string): string | null {
  return CAPAS.get(editoria) ?? null;
}
