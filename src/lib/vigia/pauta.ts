import { fontePorChave, type TipoDeFonte } from "./fontes";

export interface PautaRecebida {
  fonte: string;
  tipoDeFonte: TipoDeFonte;
  titulo: string;
  url: string;
  resumo: string | null;
  publicadoEm: string | null;
}

/**
 * Um achado recusado — não derruba o lote, mas também não some sem deixar
 * rastro. `fonte` é "desconhecida" quando o item nem chega a dizer, de forma
 * legível, de qual fonte cadastrada ele veio (campo ausente, ou fonte que
 * não está em `src/lib/vigia/fontes.ts`).
 */
export interface AchadoRecusado {
  fonte: string;
  motivo: string;
}

export type ValidacaoDeAchados =
  | { ok: true; achados: PautaRecebida[]; recusados: AchadoRecusado[] }
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

/**
 * Valida o lote inteiro.
 *
 * Duas classes de erro, de propósito. ESTRUTURAL (não é lista, passa do
 * limite de itens) derruba o lote inteiro com 400 — não há achado legível
 * para separar dos outros. Erro DE ITEM (fonte errada, tipo divergente,
 * campo vazio ou inválido) não derruba mais nada: o item vai para
 * `recusados` e os demais seguem para `achados`. Antes desta revisão, um
 * único link relativo numa fonte matava as outras duas e a execução inteira
 * desaparecia sem gravar `vigia_execucoes` — exatamente o estado que a
 * tabela existe para tornar impossível.
 */
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
  const recusados: AchadoRecusado[] = [];

  for (const cru of bruto) {
    if (!cru || typeof cru !== "object") {
      recusados.push({ fonte: "desconhecida", motivo: "Item de achado não é objeto." });
      continue;
    }
    const a = cru as Record<string, unknown>;

    const fonteInformada = typeof a.fonte === "string" ? a.fonte.trim() : "";
    const cadastro = fonteInformada ? fontePorChave(fonteInformada) : null;
    if (!cadastro) {
      recusados.push({
        fonte: "desconhecida",
        motivo: `Fonte "${fonteInformada || "(vazia)"}" não está cadastrada.`,
      });
      continue;
    }
    const fonte = fonteInformada;

    // A CON-1, em código. O tipo NÃO vem do que a requisição disse: vem do
    // cadastro. Divergência é recusa, não correção silenciosa — um
    // adaptador de imprensa que se declarasse primária alcançaria, nas
    // etapas seguintes, o gerador de matéria.
    if (a.tipoDeFonte !== cadastro.tipo) {
      // O conselho antigo ("não declare o tipo: ele sai do cadastro") não
      // resolve nada: omitir o campo cai na MESMA comparação — undefined
      // também é diferente de cadastro.tipo — e leva à mesma recusa. O que
      // de fato resolve é declarar o tipo que o cadastro tem, ou corrigir o
      // cadastro em src/lib/vigia/fontes.ts.
      recusados.push({
        fonte,
        motivo: `A fonte "${fonte}" é de ${cadastro.tipo} e o achado veio como "${String(a.tipoDeFonte)}". Declare tipoDeFonte como "${cadastro.tipo}", que é o que o cadastro tem, ou corrija o cadastro em src/lib/vigia/fontes.ts.`,
      });
      continue;
    }

    const titulo = typeof a.titulo === "string" ? a.titulo.trim() : "";
    if (!titulo) {
      recusados.push({ fonte, motivo: "Achado sem título." });
      continue;
    }

    const url = typeof a.url === "string" ? a.url.trim() : "";
    if (!/^https?:\/\//i.test(url)) {
      recusados.push({ fonte, motivo: `Endereço inválido: "${url || "(vazio)"}".` });
      continue;
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

  return { ok: true, achados, recusados };
}

/**
 * Agrupa os recusados por fonte, no formato que a execução grava em
 * `falhas`: `"3 itens ilegíveis"`. Existe para que um link relativo numa
 * fonte apareça no painel como contagem, não como sumiço.
 */
export function contarRecusados(recusados: AchadoRecusado[]): Record<string, string> {
  const porFonte = new Map<string, number>();
  for (const r of recusados) porFonte.set(r.fonte, (porFonte.get(r.fonte) ?? 0) + 1);

  const resultado: Record<string, string> = {};
  for (const [fonte, n] of porFonte) {
    resultado[fonte] = `${n} ${n === 1 ? "item ilegível" : "itens ilegíveis"}`;
  }
  return resultado;
}
