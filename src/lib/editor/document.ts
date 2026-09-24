/**
 * O documento de blocos da matéria.
 *
 * Formato do Tiptap (ProseMirror): uma árvore de nós tipados. Este módulo é
 * a parte que NÃO depende do editor — percorrer, extrair e cortar. Fica
 * separado de propósito: roda no servidor, no teste e na rota de API, sem
 * carregar React nem o editor junto.
 */

export interface NoDeBloco {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NoDeBloco[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface DocumentoBlocos extends NoDeBloco {
  type: "doc";
}

/** Nós que carregam texto editorial em atributo, não em filhos. */
const TEXTO_EM_ATRIBUTO: Record<string, string[]> = {
  image: ["legenda", "credito"],
};

/** Nós que encerram um parágrafo de saída ao serem fechados. */
const BLOCOS_DE_LINHA = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "listItem",
  "codeBlock",
  "image",
]);

/** Nome do bloco que guarda o trecho restrito a assinantes. */
export const BLOCO_RESTRITO = "proBox";

/** Substitui o conteúdo restrito. A interface reconhece por este tipo. */
export const MARCADOR_RESTRITO = "conteudoRestrito";

/**
 * Texto puro do documento, para a coluna de busca.
 *
 * Inclui o interior do bloco restrito de propósito: a busca é interna, e o
 * editor precisa achar a matéria pelo que ela diz, inclusive na parte paga.
 * Quem corta para o leitor é `cortarRestrito`, antes de servir.
 *
 * Atributo técnico (chave de indicador, URL, slug) fica de fora — não é
 * texto que alguém procuraria.
 */
export function extrairTexto(doc: NoDeBloco | null | undefined): string {
  if (!doc) return "";

  const linhas: string[] = [];

  const percorrer = (no: NoDeBloco, acumulador: string[]): void => {
    if (no.text) {
      acumulador.push(no.text);
      return;
    }

    const emAtributo = TEXTO_EM_ATRIBUTO[no.type];
    if (emAtributo && no.attrs) {
      for (const chave of emAtributo) {
        const valor = no.attrs[chave];
        if (typeof valor === "string" && valor.trim()) acumulador.push(valor.trim());
      }
    }

    if (!no.content) return;

    if (BLOCOS_DE_LINHA.has(no.type)) {
      const proprio: string[] = [];
      for (const filho of no.content) percorrer(filho, proprio);
      const linha = proprio.join("").trim();
      if (linha) linhas.push(linha);
      return;
    }

    for (const filho of no.content) percorrer(filho, acumulador);
  };

  // O nó raiz e os contêineres empurram linhas direto; o acumulador serve
  // apenas aos nós de texto dentro de um bloco de linha.
  const solto: string[] = [];
  percorrer(doc, solto);
  const restante = solto.join("").trim();
  if (restante) linhas.push(restante);

  return linhas.join("\n\n");
}

/**
 * Devolve uma cópia do documento com o interior de cada bloco restrito
 * substituído por um marcador.
 *
 * Nunca modifica o original: o mesmo documento é usado para servir leitores
 * com e sem acesso na mesma requisição, e mutá-lo vazaria o corte de um para
 * o outro.
 */
export function cortarRestrito(doc: NoDeBloco): NoDeBloco {
  const transformar = (no: NoDeBloco): NoDeBloco => {
    if (no.type === BLOCO_RESTRITO) {
      return { type: MARCADOR_RESTRITO, attrs: { ...(no.attrs ?? {}) } };
    }
    if (!no.content) return { ...no };
    return { ...no, content: no.content.map(transformar) };
  };

  return transformar(doc);
}

/** Existe algum trecho restrito no documento? */
export function temTrechoRestrito(doc: NoDeBloco | null | undefined): boolean {
  if (!doc) return false;
  if (doc.type === BLOCO_RESTRITO) return true;
  return (doc.content ?? []).some(temTrechoRestrito);
}

const PALAVRAS_POR_MINUTO = 200;

/** Minutos de leitura, arredondado para cima, nunca abaixo de um. */
export function tempoDeLeitura(doc: NoDeBloco | null | undefined): number {
  const palavras = extrairTexto(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / PALAVRAS_POR_MINUTO));
}

/** Documento vazio, usado ao criar matéria nova. */
export function documentoVazio(): DocumentoBlocos {
  return { type: "doc", content: [{ type: "paragraph" }] };
}
