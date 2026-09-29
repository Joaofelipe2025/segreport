/**
 * O vigia de fontes.
 *
 *   node scripts/vigia.mjs                    # usa SEGREPORT_URL
 *   node scripts/vigia.mjs http://localhost:3000
 *
 * Lê os feeds, manda a execução inteira numa chamada, e sai com código
 * diferente de zero só quando NÃO conseguiu registrar nada — fonte que
 * falhou é registrada e não derruba a execução.
 *
 * A lista de fontes é duplicada aqui de propósito: este script roda no
 * GitHub Actions, sem o build do Next, então não dá para importar
 * `src/lib/vigia/fontes.ts`. Um teste amarra as duas listas.
 */
const BASE =
  process.argv[2] ?? process.env.SEGREPORT_URL ?? "https://segreport-five.vercel.app";
const CHAVE = process.env.INGESTAO_TOKEN;

if (!CHAVE) {
  console.error("INGESTAO_TOKEN não definida.");
  process.exit(1);
}

const FONTES = [
  { chave: "cqcs", url: "https://cqcs.com.br/feed/", tipo: "imprensa" },
  { chave: "apolice", url: "https://www.revistaapolice.com.br/feed/", tipo: "imprensa" },
  { chave: "sonho-seguro", url: "https://sonhoseguro.com.br/feed/", tipo: "imprensa" },
];

/** Mesma regra de `src/lib/vigia/feed.ts`: link, nunca comments nem guid. */
function lerItens(xml) {
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
    const titulo = pegar("title")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'");
    if (!url || !titulo) continue;

    const resumo = pegar("description")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

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

const achados = [];
const falhas = {};

for (const fonte of FONTES) {
  try {
    const r = await fetch(fonte.url, {
      headers: { "User-Agent": "SegReport-Vigia/1.0 (+https://segreport-five.vercel.app)" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) {
      falhas[fonte.chave] = `HTTP ${r.status}`;
      continue;
    }
    const itens = lerItens(await r.text());
    if (itens.length === 0) falhas[fonte.chave] = "feed sem itens legíveis";
    for (const i of itens) {
      achados.push({ fonte: fonte.chave, tipoDeFonte: fonte.tipo, ...i });
    }
    console.log(`${fonte.chave}: ${itens.length} item(ns)`);
  } catch (causa) {
    // Uma fonte que falha não derruba as outras.
    falhas[fonte.chave] = String(causa?.message ?? causa).slice(0, 200);
    console.log(`${fonte.chave}: FALHOU — ${falhas[fonte.chave]}`);
  }
}

const envio = await fetch(`${BASE}/api/vigia/execucao`, {
  method: "POST",
  headers: { Authorization: `Bearer ${CHAVE}`, "Content-Type": "application/json" },
  body: JSON.stringify({ achados, falhas }),
});

const resposta = await envio.json().catch(() => ({}));

if (!envio.ok) {
  if (envio.status === 503) {
    console.error(
      `falhou ao registrar: o vigia ainda não foi instalado no banco (HTTP 503).`,
      resposta.comoCorrigir ?? resposta.erro ?? resposta
    );
  } else {
    console.error(`falhou ao registrar: HTTP ${envio.status}`, resposta);
  }
  process.exit(1);
}

console.log(
  `registrado: ${resposta.novas} nova(s), ${resposta.repetidas} repetida(s)` +
    (Object.keys(falhas).length ? ` | falhas em ${Object.keys(falhas).join(", ")}` : "")
);
