import { Node, mergeAttributes } from "@tiptap/core";
import { BLOCO_RESTRITO } from "./document";

/**
 * Os três blocos próprios do SegReport.
 *
 * Definidos com a API declarativa do Tiptap, sem componente React na
 * definição: assim o mesmo esquema serve ao editor no navegador e à
 * validação no servidor. A aparência dentro do editor vem por
 * `addNodeView` no componente; a do portal, pelo renderizador.
 */

/**
 * Gráfico de indicador do Hub embutido na matéria.
 *
 * Guarda apenas a CHAVE do indicador, nunca o número. O valor é buscado na
 * renderização — assim uma matéria de três meses atrás mostra o dado
 * corrente, e uma revisão do histórico corrige o texto publicado junto.
 */
export const IndicatorChart = Node.create({
  name: "indicatorChart",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      indicatorKey: { default: null },
      months: { default: 12 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-bloco="indicator-chart"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-bloco": "indicator-chart" }),
    ];
  },
});

/**
 * Trecho restrito a assinantes dentro de matéria aberta.
 *
 * É um contêiner de blocos, não um átomo: o editor escreve dentro dele
 * normalmente. O corte para quem não tem acesso acontece no servidor, em
 * `cortarRestrito` — o texto nunca chega ao navegador do leitor sem direito.
 */
export const ProBox = Node.create({
  name: BLOCO_RESTRITO,
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-bloco="pro-box"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-bloco": "pro-box" }),
      0,
    ];
  },
});

/** Curadoria manual de matérias relacionadas, por slug. */
export const RelatedArticles = Node.create({
  name: "relatedArticles",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      slugs: {
        default: [] as string[],
        // Os atributos viajam por HTML quando o documento é colado ou
        // recuperado do DOM, e ali tudo é string.
        parseHTML: (element) => {
          const bruto = element.getAttribute("data-slugs") ?? "";
          return bruto.split(",").map((s) => s.trim()).filter(Boolean);
        },
        renderHTML: (attrs) => ({
          "data-slugs": Array.isArray(attrs.slugs) ? attrs.slugs.join(",") : "",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-bloco="related-articles"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-bloco": "related-articles" }),
    ];
  },
});

/** Legenda e crédito na imagem — são texto editorial, não decoração. */
export const imagemComLegenda = {
  legenda: { default: "" },
  credito: { default: "" },
};

export const BLOCOS_PROPRIOS = [IndicatorChart, ProBox, RelatedArticles];
