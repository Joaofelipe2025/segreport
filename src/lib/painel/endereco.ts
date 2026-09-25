import { slugDeNome } from "@/lib/auth/rules";

/**
 * Um endereço livre para a matéria que está nascendo.
 *
 * Dois problemas, um só lugar para resolver:
 *
 * COLISÃO. `slug` é único na tabela inteira, e coluna diária repete título
 * por natureza — "Boletim do dia" existe uma vez e pronto. Recusar a criação
 * joga o problema no colo do colunista, que não pode resolvê-lo: o campo
 * Endereço é desabilitado para ele, e o gatilho `guard_article_columns` barra
 * a troca no banco. O sufixo deixa a matéria nascer; o portão de publicação
 * é que cobra um endereço escolhido antes de ir ao ar.
 *
 * VAZIO. `slugDeNome` só preserva `[a-z0-9]`, então "...", "🔥🔥🔥" e
 * "Проверка" viram string vazia — que `text not null unique` aceita sem
 * reclamar. A matéria ia ao ar em `/noticias/`, que é a própria listagem:
 * publicada e inalcançável. Sem base utilizável, cai para um endereço de
 * trabalho, e o portão cobra a troca.
 */
export function enderecoDisponivel(titulo: string, ocupados: string[]): string {
  const base = slugDeNome(titulo) || `materia-${Date.now().toString(36)}`;
  const tomados = new Set(ocupados);

  if (!tomados.has(base)) return base;

  // Começa em 2 porque o primeiro já é o sem sufixo. O teto existe para não
  // varrer a tabela: além dele, o relógio desempata.
  for (let n = 2; n <= 50; n += 1) {
    const tentativa = `${base}-${n}`;
    if (!tomados.has(tentativa)) return tentativa;
  }
  return `${base}-${Date.now().toString(36)}`;
}
