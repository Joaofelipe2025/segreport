export interface Credito {
  href: string;
  rotulo: string;
}

/**
 * O endereço serve como crédito?
 *
 * Exportado porque a rota precisa recusar EXATAMENTE o que a página não
 * consegue renderizar. Duas noções de "é um endereço" produziam matéria
 * derivada sem atribuição: a rota aceitava `https://` e a página, que não
 * consegue extrair hostname dali, não mostrava nada.
 *
 * Exige: parseia como URL, protocolo `http:` ou `https:`, hostname não
 * vazio e com pelo menos um ponto, e nenhum espaço.
 */
export function enderecoDeCredito(url: string): boolean {
  if (/\s/.test(url)) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  return u.hostname.includes(".") && !u.hostname.startsWith(".") && !u.hostname.endsWith(".");
}

/**
 * O crédito ao veículo de origem: para onde o link aponta e o que ele diz.
 *
 * Uma função só responde as duas coisas, de propósito: o rótulo nunca pode
 * existir sem que o endereço tenha sido validado. Só `http:` e `https:`
 * passam — o dado vem de feed de terceiro e pode ser anterior à restrição
 * do banco. Devolve nulo quando não há o que creditar, e nunca lança: roda
 * na renderização da página da matéria.
 *
 * O rótulo é o nome do veículo ou, sem ele, o domínio sem `www.`. O caminho
 * e os parâmetros de rastreio que vieram no feed não entram no texto.
 */
export function creditoDaFonte(a: {
  fonteUrl?: string | null;
  fonteNome?: string | null;
}): Credito | null {
  const bruto = a.fonteUrl?.trim();
  if (!bruto) return null;

  if (!enderecoDeCredito(bruto)) return null;
  const url = new URL(bruto);

  // Credencial embutida (`https://cqcs.com.br@evil.com`) faz o endereço
  // parecer de um veículo e apontar para outro. Saem usuário e senha e, como o
  // nome vem de terceiro assim como o endereço, o rótulo deixa de poder
  // afirmar quem é o dono do link: vira o domínio real.
  const comCredencial = url.username !== "" || url.password !== "";
  url.username = "";
  url.password = "";

  const dominio = url.hostname.replace(/^www\./, "");
  const rotulo = (!comCredencial && a.fonteNome?.trim()) || dominio;
  if (!rotulo) return null;

  return { href: url.href, rotulo };
}
