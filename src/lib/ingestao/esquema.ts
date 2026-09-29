import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Node } from "@tiptap/pm/model";
import { BLOCOS_PROPRIOS } from "@/lib/editor/extensions";
import type { DocumentoBlocos, NoDeBloco } from "@/lib/editor/document";

/**
 * Prova que um documento é abrível pelo editor.
 *
 * ISTO EXISTE PORQUE O TIPTAP FALHA DA PIOR FORMA POSSÍVEL. Diante de um nó
 * que o esquema não conhece, ele não descarta o nó: esvazia o DOCUMENTO
 * INTEIRO e emite um `console.warn` que ninguém lê. A matéria abriria em
 * branco no editor, e a primeira tecla digitada gravaria o vazio por cima do
 * texto — a etapa de revisão destruindo o conteúdo que ela existe para
 * revisar.
 *
 * O esquema do editor NÃO é o do renderizador. `BlockRenderer` desenha
 * `image`; o StarterKit não tem esse nó. Verificado executando:
 *
 *   nós do StarterKit: paragraph, blockquote, bulletList, codeBlock, doc,
 *                      hardBreak, heading, horizontalRule, listItem,
 *                      orderedList, text
 *
 * A lista canônica é a de `Editor.tsx`, e é ela que este módulo espelha.
 */
const ESQUEMA = getSchema([StarterKit, ...BLOCOS_PROPRIOS]);

/**
 * Devolve a mensagem do problema, ou `null` se o documento serve.
 *
 * Pega duas classes de erro que se parecem em nada:
 *   • nó desconhecido — `Unknown node type: image`
 *   • estrutura inválida — `listItem` sem o `paragraph` que ele exige, que
 *     passa no parse e só explode na primeira transação do editor
 */
export function validarContraEsquema(doc: DocumentoBlocos): string | null {
  // A raiz precisa ser `doc`. `Node.fromJSON` aceita um `paragraph` solto sem
  // reclamar — é nó válido, só não é documento —, e ele chegaria à coluna
  // `content_json` para o editor tropeçar depois.
  if (!doc || typeof doc !== "object" || doc.type !== "doc") {
    return 'O corpo precisa ser um documento: o nó raiz tem de ser do tipo "doc".';
  }

  try {
    Node.fromJSON(ESQUEMA, doc).check();
    return null;
  } catch (causa) {
    return causa instanceof Error ? causa.message : String(causa);
  }
}

/**
 * Quantos nós o documento tem, contando em profundidade.
 *
 * A página da matéria é `force-dynamic`: cada visita re-renderiza a árvore
 * inteira no servidor. Um documento com dezenas de milhares de nós é bomba de
 * CPU permanente numa URL pública — e revisar não protege, porque ninguém
 * rola até o parágrafo cinquenta mil antes de aprovar o lide.
 */
export function contarNos(no: NoDeBloco): number {
  if (!no || typeof no !== "object") return 0;
  const filhos = Array.isArray(no.content) ? no.content : [];
  return 1 + filhos.reduce((soma, filho) => soma + contarNos(filho), 0);
}
