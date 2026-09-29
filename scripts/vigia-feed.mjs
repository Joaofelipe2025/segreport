/**
 * A parte do vigia que decide alguma coisa: a lista de fontes e o parse.
 *
 * Isto duplica `src/lib/vigia/fontes.ts` e `src/lib/vigia/feed.ts` de
 * propósito — o vigia roda no GitHub Actions, sem o build do Next, e não
 * pode importar TypeScript. Mas duplicação que ninguém compara é duplicação
 * que já divergiu: por isso mora num módulo próprio, sem efeito nenhum ao
 * ser importado, e `tests/vigia/fontes.test.ts` roda as duas cópias contra
 * as mesmas amostras reais e exige resultado idêntico.
 *
 * Esse teste existe porque a divergência já aconteceu uma vez, neste mesmo
 * arquivo: a primeira versão decodificava uma lista fixa de entidades
 * nomeadas e deixava `&#038;` passar cru para o painel.
 */

export const FONTES = [
  { chave: "cqcs", url: "https://cqcs.com.br/feed/", tipo: "imprensa" },
  { chave: "apolice", url: "https://www.revistaapolice.com.br/feed/", tipo: "imprensa" },
  { chave: "sonho-seguro", url: "https://sonhoseguro.com.br/feed/", tipo: "imprensa" },
];

const NOMEADAS = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * Decodifica entidade de HTML.
 *
 * O ramo NUMÉRICO é o que morde: o WordPress emite `&#038;` em vez de
 * `&amp;` para não codificar duas vezes, e o CQCS traz 114 delas numa única
 * leitura. Sem ele o título chega ao painel com `&#038;` cru, e fica assim
 * para sempre — o servidor só dá `.trim()`. Do lado do `feed.ts` quem
 * resolve é `htmlEntities: true` no XMLParser; aqui não há biblioteca.
 */
export function decodificar(texto) {
  return texto.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, (bruto, corpo) => {
    if (corpo[0] !== "#") return NOMEADAS[corpo.toLowerCase()] ?? bruto;
    const hex = corpo[1] === "x" || corpo[1] === "X";
    const n = parseInt(corpo.slice(hex ? 2 : 1), hex ? 16 : 10);
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : bruto;
  });
}

/** O mesmo teto que o servidor aplica ao resumo, em `src/lib/vigia/pauta.ts`. */
export const TETO_RESUMO = 2000;

/**
 * Corta o resumo no teto do servidor.
 *
 * Sem isto, um feed que passe a publicar o post inteiro em `<description>`
 * monta um corpo acima dos 512 KiB que a rota aceita. O 413 acontece ANTES
 * de a linha de execução ser gravada — ou seja, a execução sumiria sem
 * deixar rastro, que é justamente o estado que `vigia_execucoes` existe
 * para tornar impossível.
 */
function cortar(texto) {
  return texto.length > TETO_RESUMO ? texto.slice(0, TETO_RESUMO) : texto;
}

/** Mesma regra de `feed.ts`: o link vem de `<link>`, nunca de comments nem guid. */
export function lerItens(xml) {
  const itens = [];
  for (const bruto of xml.split("<item>").slice(1)) {
    const item = bruto.slice(0, bruto.indexOf("</item>"));
    const pegar = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      if (!m) return "";
      return m[1]
        .replace(/^\s*<!\[CDATA\[/, "")
        .replace(/\]\]>\s*$/, "")
        .trim();
    };

    const url = pegar("link");
    const titulo = decodificar(pegar("title"));
    if (!url || !titulo) continue;

    // Tira a marcação ANTES de decodificar, na mesma ordem de `feed.ts`:
    // ao contrário, `&lt;b&gt;` viraria `<b>` e seria removido em seguida,
    // apagando texto que o autor escreveu escapado para aparecer.
    const resumo = cortar(
      decodificar(pegar("description").replace(/<[^>]*>/g, " "))
        .replace(/\s+/g, " ")
        .trim()
    );

    const data = new Date(pegar("pubDate"));
    itens.push({
      titulo,
      url,
      resumo: resumo || null,
      publicadoEm: Number.isNaN(data.getTime()) ? null : data.toISOString(),
    });
  }
  return itens;
}
