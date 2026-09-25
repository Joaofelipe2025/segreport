/**
 * Falha de consulta deixa de virar "não existe".
 *
 * O padrão `const { data } = await supabase...` descarta o `error`. Quando a
 * consulta do editor passou a receber 42501 por causa das colunas revogadas,
 * `data` veio nulo, o código chamou `notFound()` e o usuário viu um 404 —
 * sem nenhuma pista de que o problema era permissão. A criação de matéria
 * parecia quebrada e não estava.
 *
 * `exigir` só reclama quando há erro de verdade. Linha inexistente continua
 * devolvendo nulo, porque ausência legítima não é falha.
 */

export class FalhaDeConsulta extends Error {
  /** Texto cru do Postgres/PostgREST. O painel é interno: mostramos. */
  readonly detalhe: string;

  constructor(oQue: string, detalhe: string) {
    super(`Não foi possível carregar ${oQue}.`);
    this.name = "FalhaDeConsulta";
    this.detalhe = detalhe;
  }
}

interface RespostaDoBanco {
  data: unknown;
  error: { message: string } | null;
}

/**
 * O `data` do ramo em que NÃO houve erro.
 *
 * O Supabase tipa a resposta como união discriminada — ou dado com erro nulo,
 * ou erro com dado nulo — e é preciso extrair só o primeiro ramo. As duas
 * assinaturas óbvias falham, cada uma de um jeito:
 *
 *   `{ data: T | null; error: E | null }`  → T é inferido das duas pernas da
 *   união e colapsa para `never`; toda propriedade do resultado vira erro.
 *
 *   `{ data: T; error: E | null }`  → T vira `Row[] | null`, e quem chamou
 *   passa a precisar checar nulo que o `throw` já eliminou.
 *
 * Distribuindo sobre a união, o ramo de erro não casa com `error: null` e
 * some. Sobra exatamente o que `exigir` devolve: `Row[]` para listagem,
 * `Row | null` para `maybeSingle()` — onde nulo é linha inexistente, não
 * falha.
 */
type DadoDoSucesso<R> = R extends { data: infer D; error: null } ? D : never;

export function exigir<R extends RespostaDoBanco>(
  resposta: R,
  oQue: string
): DadoDoSucesso<R> {
  if (resposta.error) throw new FalhaDeConsulta(oQue, resposta.error.message);
  return resposta.data as DadoDoSucesso<R>;
}
