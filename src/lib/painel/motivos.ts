/**
 * Por que a porta recusou.
 *
 * Lista fechada de propósito: o código vem de `?motivo=` na URL, que qualquer
 * pessoa escreve. Ecoar o valor recebido seria deixar um estranho redigir o
 * aviso que a redação lê.
 *
 * `Map` e não objeto literal: busca em objeto literal responde a
 * `constructor`, `toString` e `__proto__` com o que veio do protótipo, e
 * `?? null` não filtra função. `?motivo=constructor` viraria código-fonte de
 * função impresso na tela de login.
 */
const MENSAGENS = new Map<string, string>([
  ["sessao", "Sua sessão expirou. Entre de novo."],
  ["permissao", "Esta porta é da redação. Sua conta não tem acesso ao painel."],
  ["link-expirado", "O link venceu. Peça outro abaixo."],
  ["link-invalido", "O link não pôde ser lido. Peça outro abaixo."],
]);

export function mensagemDeMotivo(motivo: unknown): string | null {
  if (typeof motivo !== "string") return null;
  return MENSAGENS.get(motivo) ?? null;
}
