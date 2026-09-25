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
  // `criarMateria` grava `rascunho-<base36 do relógio>`. É endereço de
  // trabalho: publicar com ele põe no ar uma URL impossível de adivinhar e
  // que, depois de indexada, não se corrige sem quebrar link.
  if (materia.slug.trim().startsWith("rascunho-")) {
    faltas.push("troque o endereço provisório da matéria");
  }
  // `extrairTexto` ignora atributo técnico de propósito: matéria que só tem
  // um gráfico embutido não tem texto, e não é matéria.
  if (!materia.corpo || extrairTexto(materia.corpo).trim().length === 0) {
    faltas.push("escreva o corpo da matéria");
  }

  return faltas;
}
