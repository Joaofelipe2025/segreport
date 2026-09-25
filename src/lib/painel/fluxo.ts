import type { Role } from "@/lib/auth/rules";
import { slugDeNome } from "@/lib/auth/rules";

/**
 * O fluxo editorial, em três estados.
 *
 *   Rascunho  ──enviar──▶  Em revisão  ──publicar──▶  Publicada
 *      ▲                        │                        │
 *      └────────devolver────────┘                        │
 *      └──────────────────despublicar────────────────────┘
 *
 * O banco ainda conhece `scheduled` e `archived`, e vai continuar conhecendo:
 * a restrição é DDL e há linhas antigas. Mas eles saíram do fluxo.
 *
 * `scheduled` porque NUNCA FUNCIONOU — não existe `pg_cron` neste projeto, e
 * nada publica sozinho. Um botão que promete publicar mais tarde e não
 * publica é pior do que a ausência dele.
 *
 * `archived` porque "despublicar" já é voltar para rascunho, e um quarto
 * estado só para dizer "esteve no ar e saiu" obrigava a inventar caminho de
 * volta que ninguém pediu.
 */
export const ESTADOS_DO_FLUXO = ["draft", "in_review", "published"] as const;

export type EstadoDoFluxo = (typeof ESTADOS_DO_FLUXO)[number];

export interface Transicao {
  para: string;
  rotulo: string;
  /** `primario` é o caminho esperado; `discreto` é a saída. */
  tom: "primario" | "discreto";
}

/**
 * O que oferecer a partir daqui.
 *
 * O admin publica direto do rascunho: em redação pequena, obrigá-lo a mandar
 * para si mesmo e depois devolver é cerimônia sem ganho. A revisão existe
 * para o texto de outra pessoa, e continua disponível para quando ele quiser.
 */
export function transicoesDe(status: string, papel: Role): Transicao[] {
  if (papel === "columnist") {
    // Publicar é do administrador — a RLS impede de qualquer forma.
    return status === "draft"
      ? [{ para: "in_review", rotulo: "Enviar para revisão", tom: "primario" }]
      : [];
  }

  if (papel !== "admin") return [];

  switch (status) {
    case "draft":
      return [
        { para: "in_review", rotulo: "Enviar para revisão", tom: "discreto" },
        { para: "published", rotulo: "Publicar", tom: "primario" },
      ];
    case "in_review":
      return [
        { para: "draft", rotulo: "Devolver para rascunho", tom: "discreto" },
        { para: "published", rotulo: "Publicar", tom: "primario" },
      ];
    case "published":
      return [{ para: "draft", rotulo: "Despublicar", tom: "discreto" }];
    default:
      // `scheduled` e `archived` não nascem mais aqui, mas linhas antigas
      // existem. Sem uma saída, ficariam presas para sempre.
      return [{ para: "draft", rotulo: "Trazer para rascunho", tom: "primario" }];
  }
}

/**
 * Depois de publicada, o endereço não se mexe.
 *
 * Trocar o slug de matéria que já esteve no ar transforma em 404 todo link
 * compartilhado, indexado ou citado — e não há redirecionamento. O título
 * pode ser corrigido à vontade; o endereço, não.
 */
export function enderecoEstaCongelado(status: string): boolean {
  return status === "published" || status === "archived";
}

/**
 * O endereço, calculado a partir do título.
 *
 * Antes era campo manual, e o portão de publicação exigia trocá-lo antes de
 * publicar — uma tarefa a mais em cima de quem está fechando matéria, para
 * produzir exatamente o que o título já dizia.
 *
 * Mantém o que havia quando o título está em branco (nada a derivar) e
 * quando a matéria já foi publicada (link no ar).
 */
export function enderecoAPartirDoTitulo(
  titulo: string,
  enderecoAtual: string,
  status: string
): string {
  if (enderecoEstaCongelado(status) && enderecoAtual) return enderecoAtual;
  if (!titulo.trim()) return enderecoAtual;

  // Sem base utilizável — título só com emoji, por exemplo — vale o endereço
  // de trabalho, que o portão de publicação cobra antes de ir ao ar.
  return slugDeNome(titulo) || enderecoAtual || `materia-${Date.now().toString(36)}`;
}

/**
 * O valor a gravar na coluna `slug`, ou `undefined` para não tocá-la.
 *
 * Quem decide é o SERVIDOR, não o cliente. O campo de endereço existe no
 * formulário e é editável pelo admin, então um POST direto pode mandar
 * qualquer coisa — inclusive para uma matéria publicada, cujo link não pode
 * mudar. `undefined` no update do Supabase significa "deixe esta coluna como
 * está", que é exatamente o que congelar quer dizer.
 *
 * Também nunca grava vazio: string vazia é aceita por `text not null unique`
 * e poria a matéria em `/noticias/`, que é a própria listagem.
 */
export function enderecoParaGravar(
  titulo: string,
  enderecoDoFormulario: string,
  status: string
): string | undefined {
  if (enderecoEstaCongelado(status)) return undefined;

  const escolhido = slugDeNome(enderecoDoFormulario) || slugDeNome(titulo);
  return escolhido || undefined;
}
