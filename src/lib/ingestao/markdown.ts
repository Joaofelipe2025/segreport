import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { BLOCOS_PROPRIOS } from "@/lib/editor/extensions";
import type { DocumentoBlocos, NoDeBloco } from "@/lib/editor/document";
import { contarNos, validarContraEsquema } from "./esquema";

/**
 * Markdown do Astra vira documento do editor.
 *
 * Usa o parser OFICIAL do Tiptap, não um escrito à mão. A tentação de fazer
 * à mão era real — o projeto tem gosto por isso, com codificador PNG e RSS
 * próprios —, mas aqueles são formatos de SAÍDA, que controlamos inteiros.
 * Markdown é entrada, e entrada é adversarial por acidente mesmo vinda de um
 * modelo instruído: `Texto\n---` é H2 e não linha horizontal, quebra forte
 * são dois espaços invisíveis no fim da linha, ênfase aninhada, lista com
 * dois ou quatro espaços de recuo.
 *
 * O que decide a questão não é a lista de casos: é que o parser oficial monta
 * o documento PARA DENTRO do esquema, o que torna estruturalmente impossível
 * produzir o nó que esvaziaria o editor.
 */

/** Teto de nós. Ver `contarNos` para o porquê. */
export const LIMITE_DE_NOS = 4000;

const EXTENSOES = [StarterKit, ...BLOCOS_PROPRIOS];
const gerenciador = new MarkdownManager({ extensions: EXTENSOES });

export type Conversao =
  | { ok: true; doc: DocumentoBlocos }
  | { ok: false; erro: string; comoCorrigir: string };

const recusar = (erro: string, comoCorrigir: string): Conversao => ({
  ok: false,
  erro,
  comoCorrigir,
});

/**
 * Link só para `https:` ou caminho interno.
 *
 * O React neutraliza `javascript:` ao renderizar, então isto não é a defesa
 * contra script — é contra o link ficar gravado e visível, e contra o risco
 * que nenhum código resolve: um endereço fabricado pelo modelo, apontando
 * para domínio sósia, publicado sob a marca do veículo.
 */
function linkProibido(no: NoDeBloco): string | null {
  for (const marca of no.marks ?? []) {
    if (marca.type !== "link") continue;
    const href = String(marca.attrs?.href ?? "");
    if (href.startsWith("/")) continue;
    if (/^https:\/\//i.test(href)) continue;
    return href;
  }
  for (const filho of no.content ?? []) {
    const achado = linkProibido(filho);
    if (achado) return achado;
  }
  return null;
}

export function converterMarkdown(markdown: string): Conversao {
  if (!markdown.trim()) {
    return recusar(
      "O corpo da matéria chegou vazio.",
      "Envie o texto da matéria em `corpoMarkdown`."
    );
  }

  let doc: DocumentoBlocos;
  try {
    doc = gerenciador.parse(markdown) as DocumentoBlocos;
  } catch (causa) {
    return recusar(
      `Não consegui interpretar o Markdown: ${causa instanceof Error ? causa.message : causa}`,
      "Use só parágrafos, subtítulos (##), listas, citações (>), código e links."
    );
  }

  const nos = contarNos(doc);
  if (nos > LIMITE_DE_NOS) {
    return recusar(
      `A matéria tem ${nos} blocos e o limite é ${LIMITE_DE_NOS}.`,
      "Deixe o texto mais curto, ou divida em mais de uma matéria."
    );
  }

  const href = linkProibido(doc);
  if (href) {
    return recusar(
      `O link "${href}" não é permitido.`,
      "Use apenas endereços https:// ou caminhos internos começando com /."
    );
  }

  // A prova final: o documento abre no editor? Um nó que o esquema não
  // conhece esvaziaria a matéria na revisão, em silêncio.
  const problema = validarContraEsquema(doc);
  if (problema) {
    // A causa é diagnosticada na ORIGEM, não na mensagem do ProseMirror:
    // `![alt](url)` vira um nó de texto solto na raiz, e o erro sai como
    // `Invalid content for node doc: <"alt">` — sem a palavra "imagem" em
    // lugar nenhum. Quem lê a resposta é o Astra, e ele precisa saber o que
    // parar de escrever.
    const causa = /!\[[^\]]*\]\(/.test(markdown)
      ? "Não use imagens no corpo. A foto da matéria é a capa, enviada no painel."
      : /^\s*\|.*\|/m.test(markdown)
        ? "Não use tabelas — o editor não tem esse bloco. Descreva os números em texto ou lista."
        : "Use só parágrafos, subtítulos (##), listas, citações (>), código e links.";

    return recusar(`O corpo tem algo que o editor não sabe abrir: ${problema}`, causa);
  }

  return { ok: true, doc };
}
