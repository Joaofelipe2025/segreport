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
 * A lista de fontes e o parse moram em `vigia-feed.mjs`, duplicando o que
 * existe em `src/lib/vigia/` de propósito: este script roda no GitHub
 * Actions, sem o build do Next. Um teste roda as duas cópias contra as
 * mesmas amostras reais e exige resultado idêntico.
 */

import { FONTES, lerItens } from "./vigia-feed.mjs";

// `||`, não `??`: o GitHub Actions define a variável de ambiente como STRING
// VAZIA quando ela não está cadastrada, e `??` só troca null/undefined —
// "" passava direto, o endereço virava "" e o script morria em
// `TypeError: Invalid URL` depois de já ter lido os três feeds, sem dizer o
// que fazer, e o padrão de produção desta própria linha nunca era alcançado.
const BASE =
  process.argv[2] || process.env.SEGREPORT_URL || "https://segreport-five.vercel.app";
const CHAVE = process.env.INGESTAO_TOKEN;

if (!CHAVE) {
  console.error("INGESTAO_TOKEN não definida.");
  process.exit(1);
}

try {
  new URL(BASE);
} catch {
  console.error(`Endereço do SegReport inválido: "${BASE}".`);
  console.error("Passe como argumento ou configure a variável SEGREPORT_URL.");
  process.exit(1);
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
  // Imprime o que a rota disse, sem cravar a causa. O 503 dela vale tanto
  // para "migração não aplicada" quanto para "INGESTAO_TOKEN ausente no
  // servidor", e nomear o banco nos dois casos manda quem lê o log de
  // Actions procurar o arquivo errado.
  console.error(
    `falhou ao registrar (HTTP ${envio.status}): ${resposta.erro ?? JSON.stringify(resposta)}`
  );
  if (resposta.comoCorrigir) console.error(resposta.comoCorrigir);
  process.exit(1);
}

console.log(
  `registrado: ${resposta.novas} nova(s), ${resposta.repetidas} repetida(s)` +
    (Object.keys(falhas).length ? ` | falhas em ${Object.keys(falhas).join(", ")}` : "")
);
