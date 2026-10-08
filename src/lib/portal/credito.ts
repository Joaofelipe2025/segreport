export interface Credito {
  href: string;
  rotulo: string;
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

  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const dominio = url.hostname.replace(/^www\./, "");
  const rotulo = a.fonteNome?.trim() || dominio;
  if (!rotulo) return null;

  return { href: url.href, rotulo };
}
