import { createHash } from "node:crypto";
import { CATEGORIES } from "@/lib/categories";

/**
 * O que o Astra manda, e o que aceitamos.
 *
 * As mensagens de recusa são escritas PARA UM MODELO LER. O Actions do GPT
 * mostra o corpo da resposta de volta ao agente: "categoria inválida" faz ele
 * reenviar o mesmo payload até estourar a cota; "use uma de: mercado,
 * regulacao, …" faz ele se corrigir sozinho na tentativa seguinte.
 */

/**
 * A lista sai de `CATEGORIES`, e um teste amarra as duas.
 *
 * Sem isso, esta seria a quinta fonte de verdade sobre editorias — banco,
 * `categories.ts`, contrato, prompt do Astra e esquema OpenAPI — e a primeira
 * a divergir em silêncio.
 */
export const CATEGORIAS_ACEITAS: readonly string[] = CATEGORIES.map((c) => c.slug);

/** Teto do texto cru, antes de gastar CPU interpretando. */
export const LIMITE_DE_MARKDOWN = 80_000;

export interface PedidoDeIngestao {
  titulo: string;
  categoria: string;
  corpoMarkdown: string;
  linhaDeApoio: string | null;
  resumo: string | null;
  seoTitulo: string | null;
  seoDescricao: string | null;
  /** De onde veio a matéria. Nulo é o caminho manual e o do agente externo. */
  origem: "release" | "primaria" | "derivada" | null;
  fonteOriginalUrl: string | null;
  fonteOriginalNome: string | null;
  /** A pauta que originou a matéria, para marcá-la como usada. */
  pautaId: string | null;
  /** Endereço http(s) ou caminho do próprio site (começa com uma barra). */
  capaUrl: string | null;
}

const ORIGENS: readonly string[] = ["release", "primaria", "derivada"];

export type Validacao =
  | { ok: true; pedido: PedidoDeIngestao }
  | { ok: false; erro: string; comoCorrigir: string };

const recusar = (erro: string, comoCorrigir: string): Validacao => ({
  ok: false,
  erro,
  comoCorrigir,
});

/** Texto opcional: em branco vira nulo, nunca string vazia no banco. */
function opcional(valor: unknown): string | null {
  const t = typeof valor === "string" ? valor.trim() : "";
  return t || null;
}

export function validarPedido(corpo: unknown): Validacao {
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
    return recusar(
      "O corpo da requisição não é um objeto JSON.",
      'Envie JSON com os campos: titulo, categoria, corpoMarkdown.'
    );
  }

  const c = corpo as Record<string, unknown>;

  // Modelo adora deixar quebra de linha no fim do título.
  const titulo = typeof c.titulo === "string" ? c.titulo.trim() : "";
  if (titulo.length < 3) {
    return recusar(
      "Título ausente ou curto demais.",
      "Envie `titulo` com pelo menos três caracteres."
    );
  }

  const categoria = typeof c.categoria === "string" ? c.categoria.trim().toLowerCase() : "";
  if (!CATEGORIAS_ACEITAS.includes(categoria)) {
    return recusar(
      `Categoria "${categoria || "(vazia)"}" não existe no portal.`,
      `Use uma destas em \`categoria\`: ${CATEGORIAS_ACEITAS.join(", ")}.`
    );
  }

  const corpoMarkdown = typeof c.corpoMarkdown === "string" ? c.corpoMarkdown : "";
  if (!corpoMarkdown.trim()) {
    return recusar(
      "O corpo da matéria veio vazio.",
      "Envie o texto em `corpoMarkdown`, em Markdown."
    );
  }
  if (corpoMarkdown.length > LIMITE_DE_MARKDOWN) {
    return recusar(
      `O texto tem ${corpoMarkdown.length} caracteres e o limite é ${LIMITE_DE_MARKDOWN}.`,
      "Deixe a matéria mais curta, ou divida em mais de uma."
    );
  }

  const origem = typeof c.origem === "string" ? c.origem.trim() : "";
  if (origem && !ORIGENS.includes(origem)) {
    return recusar(
      `Origem "${origem}" não existe.`,
      `Use uma destas em \`origem\`: ${ORIGENS.join(", ")} — ou omita o campo.`
    );
  }

  const fonteUrl = typeof c.fonteOriginalUrl === "string" ? c.fonteOriginalUrl.trim() : "";
  if (fonteUrl && !/^https?:\/\//i.test(fonteUrl)) {
    return recusar(
      "O endereço de origem precisa começar com http:// ou https://.",
      "Envie `fonteOriginalUrl` como endereço completo."
    );
  }

  // A mesma regra que a check constraint do banco impõe — mas aqui ela devolve
  // uma mensagem que o agente consegue ler e corrigir, em vez de um 500 cru.
  if (origem === "derivada" && !fonteUrl) {
    return recusar(
      "Matéria derivada precisa dizer de onde veio.",
      "Envie `fonteOriginalUrl` com o endereço da cobertura de origem, ou use outra `origem`."
    );
  }

  // Caminho do site OU endereço http(s). `//host` fica de fora: o navegador o
  // lê como endereço externo com o protocolo da página.
  const capaUrl = typeof c.capaUrl === "string" ? c.capaUrl.trim() : "";
  const capaValida =
    /^https?:\/\//i.test(capaUrl) || (capaUrl.startsWith("/") && !capaUrl.startsWith("//"));
  if (capaUrl && !capaValida) {
    return recusar(
      "O endereço da capa não é válido.",
      "Envie `capaUrl` começando com http://, https:// ou uma barra (caminho do próprio site), ou omita o campo."
    );
  }

  return {
    ok: true,
    pedido: {
      titulo,
      categoria,
      corpoMarkdown,
      linhaDeApoio: opcional(c.linhaDeApoio),
      resumo: opcional(c.resumo),
      seoTitulo: opcional(c.seoTitulo),
      seoDescricao: opcional(c.seoDescricao),
      origem: (origem || null) as PedidoDeIngestao["origem"],
      fonteOriginalUrl: fonteUrl || null,
      fonteOriginalNome: opcional(c.fonteOriginalNome),
      pautaId: opcional(c.pautaId),
      capaUrl: capaUrl || null,
    },
  };
}

/**
 * A chave que diz se já recebemos isto.
 *
 * É hash do CONTEÚDO, não do endereço. O caminho do slug estaria errado nas
 * duas direções: coluna diária repete título por natureza — `endereco.ts`
 * existe justamente por causa disso —, e o slug ainda é recalculado a cada
 * gravação enquanto a matéria não foi publicada, então ele se move durante a
 * revisão.
 *
 * Com o conteúdo na chave, reenvio idêntico é duplicata (e respondemos com a
 * matéria que já existe), enquanto reenvio CORRIGIDO é matéria nova — que é o
 * que precisa acontecer, porque responder "sucesso" a uma correção
 * descartada é o pior modo de falha possível num veículo de notícia.
 */
export function chaveDeConteudo(titulo: string, corpoMarkdown: string): string {
  return createHash("sha256")
    .update(`${titulo.trim()}\n\u0000\n${corpoMarkdown.trim()}`, "utf8")
    .digest("hex");
}
