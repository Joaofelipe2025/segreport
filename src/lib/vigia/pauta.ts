import { fontePorChave, type TipoDeFonte } from "./fontes";

export interface PautaRecebida {
  fonte: string;
  tipoDeFonte: TipoDeFonte;
  titulo: string;
  url: string;
  resumo: string | null;
  publicadoEm: string | null;
}

export type ValidacaoDeAchados =
  | { ok: true; achados: PautaRecebida[] }
  | { ok: false; erro: string; comoCorrigir: string };

/** Teto por execução. Três feeds somam 80 itens; 500 é folga com limite. */
const LIMITE = 500;

const recusar = (erro: string, comoCorrigir: string): ValidacaoDeAchados => ({
  ok: false,
  erro,
  comoCorrigir,
});

function dataOuNula(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function validarAchados(bruto: unknown): ValidacaoDeAchados {
  if (!Array.isArray(bruto)) {
    return recusar("`achados` precisa ser uma lista.", "Envie um array, mesmo que vazio.");
  }
  if (bruto.length > LIMITE) {
    return recusar(
      `A execução trouxe ${bruto.length} itens e o teto é ${LIMITE}.`,
      "Reduza a janela que o vigia lê por execução."
    );
  }

  const achados: PautaRecebida[] = [];

  for (const cru of bruto) {
    if (!cru || typeof cru !== "object") {
      return recusar("Item de achado não é objeto.", "Cada achado é um objeto JSON.");
    }
    const a = cru as Record<string, unknown>;

    const fonte = typeof a.fonte === "string" ? a.fonte.trim() : "";
    const cadastro = fontePorChave(fonte);
    if (!cadastro) {
      return recusar(
        `Fonte "${fonte || "(vazia)"}" não está cadastrada.`,
        "Use uma das fontes de src/lib/vigia/fontes.ts."
      );
    }

    // A CON-1, em código. O tipo NÃO vem do que a requisição disse: vem do
    // cadastro. Divergência é recusa, não correção silenciosa — um
    // adaptador de imprensa que se declarasse primária alcançaria, nas
    // etapas seguintes, o gerador de matéria.
    if (a.tipoDeFonte !== cadastro.tipo) {
      return recusar(
        `A fonte "${fonte}" é de ${cadastro.tipo} e o achado veio como "${String(a.tipoDeFonte)}".`,
        "Não declare o tipo: ele sai do cadastro da fonte."
      );
    }

    const titulo = typeof a.titulo === "string" ? a.titulo.trim() : "";
    if (!titulo) {
      return recusar("Achado sem título.", "Todo achado precisa de `titulo`.");
    }

    const url = typeof a.url === "string" ? a.url.trim() : "";
    if (!/^https?:\/\//i.test(url)) {
      return recusar(
        `Endereço inválido: "${url || "(vazio)"}".`,
        "`url` precisa começar com http:// ou https://."
      );
    }

    const resumo = typeof a.resumo === "string" ? a.resumo.trim() : "";

    achados.push({
      fonte,
      tipoDeFonte: cadastro.tipo,
      titulo,
      url,
      resumo: resumo || null,
      publicadoEm: dataOuNula(a.publicadoEm),
    });
  }

  return { ok: true, achados };
}
