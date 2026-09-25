import { extrairTexto, type DocumentoBlocos } from "@/lib/editor/document";

export interface MateriaParaPublicar {
  title: string;
  category_id: number | null;
  slug: string;
  corpo: DocumentoBlocos | null;
}

/**
 * O que ainda falta para esta matéria ir ao ar.
 *
 * Devolve tudo de uma vez. Um erro por vez transforma publicar em ciclo de
 * tentativa e frustração, e quem está fechando matéria costuma estar com
 * pressa.
 *
 * Isto é conveniência de interface, não barreira: quem impede de verdade é a
 * RLS, que só deixa admin gravar `published`. O portão evita o acidente, não
 * o ataque.
 */
export function pendenciasParaPublicar(materia: MateriaParaPublicar): string[] {
  const faltas: string[] = [];

  if (materia.title.trim().length < 3) {
    faltas.push("o título precisa de pelo menos três caracteres");
  }
  if (materia.category_id === null) {
    faltas.push("escolha uma categoria");
  }
  // Endereço vazio é aceito pelo banco — `text not null unique` deixa passar
  // string vazia — e põe a matéria em /noticias/, que é a própria listagem:
  // publicada e inalcançável.
  //
  // `rascunho-*` e `materia-*` são endereços de trabalho, gerados quando não
  // havia base utilizável no título ou quando o endereço limpo já estava
  // ocupado. Publicar com um deles põe no ar uma URL que ninguém escolheu e
  // que, depois de indexada, não se corrige sem quebrar link.
  const endereco = materia.slug.trim();
  if (endereco.length === 0) {
    faltas.push("a matéria precisa de um endereço");
  } else if (endereco.startsWith("rascunho-") || endereco.startsWith("materia-")) {
    // Só chega aqui quem tem título sem nenhum caractere aproveitável —
    // "🔥🔥🔥", "···". O endereço vem do título agora, então a instrução
    // aponta para o título, não para um campo que a pessoa não edita mais.
    faltas.push("dê um título com letras ou números — o endereço sai dele");
  }
  // `extrairTexto` ignora atributo técnico de propósito: matéria que só tem
  // um gráfico embutido não tem texto, e não é matéria.
  if (!materia.corpo || extrairTexto(materia.corpo).trim().length === 0) {
    faltas.push("escreva o corpo da matéria");
  }

  return faltas;
}
