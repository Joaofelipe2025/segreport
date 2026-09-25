import type { IndicatorDefinition } from "@/lib/types";

const DATE_LONG = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const MONTH_YEAR = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

/** "terça-feira, 22 de setembro de 2026" */
export function formatDateLong(iso: string | Date): string {
  return DATE_LONG.format(new Date(iso));
}

/** "22 set. 2026" */
export function formatDateShort(iso: string | Date): string {
  return DATE_SHORT.format(new Date(iso));
}

/** "setembro de 2026" */
export function formatMonthYear(iso: string | Date): string {
  return MONTH_YEAR.format(new Date(iso));
}

/**
 * "há 3 dias", "em 2h" — distância humana até uma data.
 *
 * Trata futuro porque o painel mostra matéria agendada: `scheduled_for` está
 * à frente de agora. A conta crua dava minuto negativo, e o `Math.max(_, 1)`
 * o transformava em "há 1 min" — errado sem parecer errado.
 */
export function formatRelative(iso: string, now = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const futuro = diffMs < 0;
  const abs = Math.abs(diffMs);
  const prefixo = (texto: string) => (futuro ? `em ${texto}` : `há ${texto}`);

  const minutes = Math.round(abs / 60000);
  if (minutes < 60) return prefixo(`${Math.max(minutes, 1)} min`);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return prefixo(`${hours}h`);
  const days = Math.round(hours / 24);
  if (days < 30) return prefixo(`${days} ${days === 1 ? "dia" : "dias"}`);
  return formatDateShort(iso);
}

/**
 * Formata o valor de um indicador conforme a unidade da definição.
 *
 * Valor ausente vira travessão, nunca zero: num produto de dado de mercado,
 * exibir 0% onde não há medição é inventar informação.
 */
export function formatIndicator(
  value: number | null | undefined,
  unit: IndicatorDefinition["unit"]
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  switch (unit) {
    case "percent":
    case "percent-points": {
      const sign = value > 0 ? "+" : "";
      return `${sign}${value.toFixed(1).replace(".", ",")}%`;
    }
    case "brl-billions":
      return `R$ ${value.toFixed(1).replace(".", ",")} bi`;
  }
}

/** Variação em pontos percentuais: "+1,1pp" / "-2,8pp" / "—" */
export function formatDelta(deltaPp: number | null | undefined): string {
  if (deltaPp === null || deltaPp === undefined || Number.isNaN(deltaPp))
    return "—";
  const sign = deltaPp > 0 ? "+" : "";
  return `${sign}${deltaPp.toFixed(1).replace(".", ",")}pp`;
}

/** Direção da variação, para escolher cor e seta. */
export function trendOf(delta: number | null | undefined): "up" | "down" | "flat" {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return "flat";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}
