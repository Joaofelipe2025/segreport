import { createHash } from "node:crypto";
import { CATEGORIES } from "@/lib/categories";
import { enderecoDeCredito } from "@/lib/portal/credito";

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
  /**
   * TODAS as pautas do grupo que originou a matéria, para marcá-las como
   * usadas. Um grupo tem N pautas: marcar uma só deixaria as outras na fila,
   * e a execução seguinte geraria a mesma matéria outra vez.
   */
  pautaIds: string[];
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

/**
 * Caminho de arquivo do projeto, por lista de permissão: começa com uma
 * barra e só tem letras, números, `/`, `.`, `-` e `_`.
 *
 * Lista de proibição não fecha a família: `\` vira `/` no navegador, tab/LF/CR
 * são removidos pelo parser de URL (`/\t/evil.com` vira `//evil.com`), `..`
 * vem codificado, `?` e `#` fazem do caminho uma URL com parâmetros. Sem `%`
 * não há escape de nenhuma camada. Só `//` e segmento `..` precisam de regra
 * à parte, porque `/` e `.` são permitidos.
 */
function caminhoLocalSeguro(caminho: string): boolean {
  if (!/^\/[A-Za-z0-9._\/-]*$/.test(caminho)) return false;
  if (caminho.startsWith("//")) return false;
  const segmentos = caminho.split("/");
  if (segmentos.some((s) => s === "..")) return false;
  // Precisa apontar para um ARQUIVO: `/` ou `/capas/` passariam na lista de
  // caracteres e quebrariam a imagem em toda a listagem.
  return /^[A-Za-z0-9_-][A-Za-z0-9._-]*\.[A-Za-z0-9]+$/.test(segmentos[segmentos.length - 1]);
}

/** Tetos de tamanho de texto de terceiro que acaba numa página pública. */
const TETO_NOME_DA_FONTE = 200;
const TETO_URL_DA_FONTE_BYTES = 2000;
const TETO_CAPA = 300;

/** O que a rota grava em `articles` a partir da procedência do pedido. */
export function camposDaProcedencia(pedido: PedidoDeIngestao) {
  return {
    origem: pedido.origem,
    fonte_original_url: pedido.fonteOriginalUrl,
    fonte_original_nome: pedido.fonteOriginalNome,
    // Derivada nasce marcada: saiu de cobertura de terceiro sem que a fonte
    // primária fosse encontrada, e ninguém conferiu ainda.
    precisa_checagem: pedido.origem === "derivada",
    cover_url: pedido.capaUrl,
  };
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

  // Campo presente com tipo errado é recusado, nunca tratado como ausente:
  // `origem: 1` viraria matéria sem origem e sem marca de checagem.
  for (const campo of ["origem", "fonteOriginalUrl", "fonteOriginalNome", "capaUrl"]) {
    const v = c[campo];
    if (v !== undefined && v !== null && typeof v !== "string") {
      return recusar(
        `O campo \`${campo}\` veio com tipo errado.`,
        `Envie \`${campo}\` como texto (string), ou omita o campo.`
      );
    }
  }

  // Lista de texto, ou nada. Elemento de outro tipo é recusado: descartá-lo
  // deixaria uma pauta na fila sem ninguém saber.
  // O campo singular antigo não é ignorado: ignorá-lo devolveria 201 sem
  // marcar pauta nenhuma e sem nenhum log (a lista nova ficaria vazia).
  if (c.pautaId !== undefined) {
    return recusar(
      "O campo `pautaId` não existe mais: virou `pautaIds` e é uma lista.",
      "Envie `pautaIds` como lista de textos (strings) com o id de TODAS as pautas do grupo, por exemplo [\"id1\", \"id2\"], e remova `pautaId`."
    );
  }

  let pautaIds: string[] = [];
  if (c.pautaIds !== undefined && c.pautaIds !== null) {
    if (!Array.isArray(c.pautaIds) || c.pautaIds.some((i) => typeof i !== "string")) {
      return recusar(
        "O campo `pautaIds` veio com tipo errado.",
        "Envie `pautaIds` como lista de textos (strings), um id por pauta do grupo, ou omita o campo."
      );
    }
    // Sem repetição: o banco casa cada id uma vez, e a conferência de
    // contagem da rota compararia errado.
    pautaIds = [
      ...new Set((c.pautaIds as string[]).map((i) => i.trim()).filter((i) => i.length > 0)),
    ];
  }

  const origem = typeof c.origem === "string" ? c.origem.trim() : "";
  if (origem && !ORIGENS.includes(origem)) {
    return recusar(
      `Origem "${origem}" não existe.`,
      `Use uma destas em \`origem\`: ${ORIGENS.join(", ")} — ou omita o campo.`
    );
  }

  const fonteUrl = typeof c.fonteOriginalUrl === "string" ? c.fonteOriginalUrl.trim() : "";
  // `fonteOriginalNome` é texto de terceiro renderizado como rótulo de link
  // público; o único limite que havia era o do corpo inteiro.
  const nomeDaFonte = typeof c.fonteOriginalNome === "string" ? c.fonteOriginalNome.trim() : "";
  if (nomeDaFonte.length > TETO_NOME_DA_FONTE) {
    return recusar(
      `O nome da fonte tem ${nomeDaFonte.length} caracteres e o limite é ${TETO_NOME_DA_FONTE}.`,
      "Envie `fonteOriginalNome` só com o nome do veículo, como \"CQCS\"."
    );
  }
  // Em BYTES, como o teto de URL do vigia: acento ocupa mais de um.
  const bytesDaFonte = Buffer.byteLength(fonteUrl, "utf8");
  if (bytesDaFonte > TETO_URL_DA_FONTE_BYTES) {
    return recusar(
      `O endereço de origem tem ${bytesDaFonte} bytes e o limite é ${TETO_URL_DA_FONTE_BYTES}.`,
      "Envie `fonteOriginalUrl` sem parâmetros de rastreio: só o endereço da matéria."
    );
  }

  // A MESMA noção de endereço que a página usa para montar o crédito: o que
  // a página não consegue renderizar a rota não pode aceitar.
  if (fonteUrl && !enderecoDeCredito(fonteUrl)) {
    return recusar(
      "O endereço de origem não é um endereço completo, com domínio.",
      "Envie `fonteOriginalUrl` como endereço completo, com http:// ou https:// e o domínio do veículo, sem espaços. Exemplo: https://cqcs.com.br/noticia/123."
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

  // Só caminho do projeto (`/capas/mercado.jpg`). O portal só otimiza imagem
  // do próprio armazenamento; um host qualquer gravaria e quebraria na página
  // enquanto o remetente recebe 201.
  const capaUrl = typeof c.capaUrl === "string" ? c.capaUrl.trim() : "";
  if (capaUrl.length > TETO_CAPA) {
    return recusar(
      `O caminho da capa tem ${capaUrl.length} caracteres e o limite é ${TETO_CAPA}.`,
      "Envie `capaUrl` como um caminho curto do projeto, como /capas/mercado.jpg."
    );
  }
  if (capaUrl && !caminhoLocalSeguro(capaUrl)) {
    return recusar(
      "A capa precisa ser um caminho do projeto, como /capas/mercado.jpg.",
      "Envie `capaUrl` como caminho do projeto: começa com uma barra e usa só letras, números, `/`, `.`, `-` e `_` (sem esquema, espaço, `?`, `#`, `%` ou `..`). Imagem hospedada fora entra pelo upload do painel."
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
      pautaIds,
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
