/**
 * De qual porta a pessoa veio.
 *
 * O retorno do link mágico cai sempre em `/auth/confirm`, e lá não há como
 * saber se quem clicou é leitor ou redação — a sessão ainda não existe, e o
 * link pode ter vencido. Sem essa informação, todo erro de link ia para
 * `/login`, e o jornalista com link vencido caía numa página de assinatura
 * com "Criar conta gratuita", longe de qualquer coisa que resolvesse.
 *
 * A alternativa seria marcar o destino em `emailRedirectTo`. Não usamos: o
 * Supabase confere o endereço contra a lista de Redirect URLs do projeto e,
 * quando não bate, ignora o destino em silêncio — comportamento que já custou
 * caro aqui. Um cookie não passa por essa lista.
 *
 * É só preferência de navegação: não decide acesso, não guarda identidade, e
 * o pior que uma adulteração consegue é mandar a pessoa para a porta errada.
 */
export const COOKIE_DA_PORTA = "segreport-porta";

export const PORTA_DA_REDACAO = "/painel/entrar";
export const PORTA_DO_LEITOR = "/login";

/** Trinta minutos: o tempo de pedir o link, abrir o e-mail e clicar. */
export const VALIDADE_DA_PORTA = 60 * 30;

export function portaDeEntrada(marcador: string | undefined): string {
  return marcador === "redacao" ? PORTA_DA_REDACAO : PORTA_DO_LEITOR;
}
