import { formatRelative } from "@/lib/format";

const DIA = 24 * 60 * 60 * 1000;

/** Depois disto, pauta não lida sai da lista principal. */
export const DIAS_NA_LISTA = 7;

export interface LinhaDePauta {
  estado: string;
  criado_em: string;
}

/**
 * O que a lista mostra por padrão.
 *
 * Só as novas, e só as recentes. As demais continuam na tabela e são
 * alcançáveis por filtro: apagar histórico de pauta é perder registro do que
 * o veículo viu e decidiu não cobrir.
 */
export function pautasVisiveis<T extends LinhaDePauta>(linhas: T[], agora: Date): T[] {
  const limite = agora.getTime() - DIAS_NA_LISTA * DIA;
  return linhas.filter(
    (l) => l.estado === "nova" && new Date(l.criado_em).getTime() >= limite
  );
}

export interface Execucao {
  comecou_em: string;
  achados: Record<string, number>;
  falhas: Record<string, string>;
}

/**
 * Como está o vigia.
 *
 * Três tons, e a escolha não é decorativa. Vigia que parou e ninguém percebeu
 * é pior do que vigia nenhum: cria a impressão de cobertura que não existe.
 *
 * `pautasUltimas24h` existe porque o vigia roda três vezes ao dia sobre a
 * MESMA janela de feed: a 2ª e a 3ª execução de um dia comum não trazem nada
 * de novo, e isso é o normal, não um sintoma. "Três feeds que mudaram de
 * formato ao mesmo tempo" (FR-2.3) é uma propriedade do DIA, não de uma
 * execução isolada — por isso a suspeita só nasce quando NENHUMA pauta nova
 * entrou nas últimas 24 horas, não quando só a última leitura ficou vazia.
 */
export function resumoDaExecucao(
  exec: Execucao | null,
  agora: Date,
  pautasUltimas24h: number
): { texto: string; tom: "calmo" | "atencao" | "alerta" } {
  if (!exec) {
    return {
      texto: "O vigia nunca rodou. Confira o agendamento no GitHub Actions.",
      tom: "alerta",
    };
  }

  const horas = (agora.getTime() - new Date(exec.comecou_em).getTime()) / (60 * 60 * 1000);
  if (horas > 24) {
    return {
      texto: `O vigia não roda há mais de ${Math.floor(horas / 24)} dia(s). Confira o agendamento.`,
      tom: "alerta",
    };
  }

  // A partir daqui a execução é recente (dentro de 24h), mas "recente" cobre
  // de 1 minuto a 23 horas — e sem dizer QUANDO, uma execução de 20 minutos
  // atrás e uma de 23 horas atrás rendem o mesmo texto. `quando` é o que a
  // FR-2.2 pede além de "o que falhou": também "quando foi".
  const quando = formatRelative(exec.comecou_em, agora);

  // Chave iniciada por `_` é aviso do sistema (hoje só `_gravacao`, que a
  // própria rota injeta quando o upsert de pautas falha) — não é nome de
  // fonte, e listá-la ao lado de "cqcs" confunde o dono do veículo.
  const chaves = Object.keys(exec.falhas);
  const falhasDeFonte = chaves.filter((k) => !k.startsWith("_"));
  const avisosDoSistema = chaves.filter((k) => k.startsWith("_"));

  if (falhasDeFonte.length > 0 || avisosDoSistema.length > 0) {
    const partes = [
      falhasDeFonte.length > 0 ? `falhou em: ${falhasDeFonte.join(", ")}` : null,
      avisosDoSistema.length > 0 ? "teve um aviso interno do vigia" : null,
    ].filter((p): p is string => p !== null);

    return {
      texto: `Última execução, ${quando}, ${partes.join(" e ")}.`,
      tom: "atencao",
    };
  }

  const total = Object.values(exec.achados).reduce((a, b) => a + b, 0);
  if (total === 0) {
    // Silêncio NESTA execução é o normal na 2ª e na 3ª leitura do dia. Só
    // vira aviso quando o dia inteiro ficou em silêncio — aí sim é a
    // assinatura que a FR-2.3 pede.
    if (pautasUltimas24h > 0) {
      return {
        texto: `Última execução, ${quando}, não trouxe pauta nova — normal quando é a 2ª ou 3ª leitura do dia sobre a mesma janela.`,
        tom: "calmo",
      };
    }
    return {
      texto: `A última execução, ${quando}, não trouxe pauta nova, e nenhuma entrou nas últimas 24 horas. Vale conferir se os três feeds ainda respondem.`,
      tom: "atencao",
    };
  }

  // "item(ns)" seria ambíguo: achados já conta pautas NOVAS por fonte, não
  // itens lidos do feed (ver rota de execução). Deixa isso explícito aqui.
  return { texto: `Última execução, ${quando}, trouxe ${total} pauta(s) nova(s).`, tom: "calmo" };
}
