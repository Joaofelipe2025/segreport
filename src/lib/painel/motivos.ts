/**
 * Por que a porta recusou.
 *
 * Lista fechada de propósito: o código vem de `?motivo=` na URL, que qualquer
 * pessoa escreve. Ecoar o valor recebido seria deixar um estranho redigir o
 * aviso que a pessoa lê.
 *
 * `Map` e não objeto literal, e isto não é preciosismo: busca em objeto
 * literal responde pelo protótipo, e `MOTIVOS["__proto__"]` devolve
 * `Object.prototype` — um objeto, truthy, que o React recusa como filho e que
 * derruba a renderização com 500. Numa rota pública, por URL que qualquer um
 * monta. `?? undefined` não filtra, porque o valor não é nulo.
 *
 * São duas portas com dois vocabulários: a redação sabe que existe um painel,
 * o leitor não precisa saber.
 */

const DA_REDACAO = new Map<string, string>([
  ["sessao", "Sua sessão expirou. Entre de novo."],
  ["permissao", "Esta porta é da redação. Sua conta não tem acesso ao painel."],
  ["link-expirado", "O link venceu. Peça outro abaixo."],
  ["link-invalido", "O link não pôde ser lido. Peça outro abaixo."],
  [
    "perfil-ilegivel",
    "Seu acesso não pôde ser verificado agora. Não é o link: tente de novo em instantes.",
  ],
]);

const DO_LEITOR = new Map<string, string>([
  ["sessao", "Sua sessão expirou. Entre novamente."],
  ["permissao", "Sua conta não tem acesso a essa área."],
  ["link-expirado", "O link expirou. Peça um novo abaixo."],
  ["link-invalido", "O link está incompleto. Peça outro."],
  [
    "perfil-ilegivel",
    "Seu acesso não pôde ser verificado agora. Não é o link: tente de novo em instantes.",
  ],
]);

function buscar(mapa: Map<string, string>, motivo: unknown): string | null {
  if (typeof motivo !== "string") return null;
  return mapa.get(motivo) ?? null;
}

export function mensagemDeMotivo(motivo: unknown): string | null {
  return buscar(DA_REDACAO, motivo);
}

export function mensagemDeMotivoDoLeitor(motivo: unknown): string | null {
  return buscar(DO_LEITOR, motivo);
}
