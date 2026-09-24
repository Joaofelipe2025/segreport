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

export function exigir<T>(
  resposta: { data: T | null; error: { message: string } | null },
  oQue: string
): T {
  if (resposta.error) throw new FalhaDeConsulta(oQue, resposta.error.message);
  return resposta.data as T;
}
