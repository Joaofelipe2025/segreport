/**
 * Imagens do preview.
 *
 * Geradas localmente pela rota `/preview` — sem rede, sem serviço externo.
 * A versão anterior usava o picsum.photos, que responde com redirecionamento
 * e leva cerca de 1,7s por imagem; com trinta imagens na home o otimizador
 * do Next estourava o tempo limite e derrubava a página inteira.
 *
 * Cada semente devolve sempre a mesma imagem, então o layout não muda entre
 * execuções. Quando o upload do CMS entrar, basta esta função passar a
 * devolver a URL do Supabase Storage.
 */
export function photo(seed: string, width: number, height: number): string {
  return `/preview/${encodeURIComponent(seed)}/${width}/${height}`;
}

/** Avatares de colunistas — proporção quadrada. */
export function avatar(seed: string, size = 160): string {
  return `/preview/${encodeURIComponent(`retrato-${seed}`)}/${size}/${size}`;
}
