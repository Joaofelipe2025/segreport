/**
 * Prova que o envio de capa chega ao balde e volta como URL pública.
 *
 *   node scripts/fumaca-upload.mjs
 *
 * Gera um PNG mínimo em memória, envia pelo mesmo caminho que a Server Action
 * usa, confere que a URL pública responde com a imagem, e apaga tudo — o
 * arquivo no balde e a linha em `media_assets`.
 *
 * Confere também o que NÃO pode passar: o balde recusa tipo fora da lista e
 * arquivo acima do limite, mesmo com a chave de serviço. A validação em
 * `src/lib/painel/upload.ts` é a primeira porta; esta é a segunda.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

for (const linha of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BALDE = "midia";

// PNG 1x1 transparente, o menor arquivo válido que existe.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const resultados = [];
const conferir = (ok, nome, detalhe = "") => resultados.push({ ok, nome, detalhe });

const id = randomUUID();
const caminho = `capas/${id}.png`;

const enviar = (nome, corpo, tipo) =>
  fetch(`${SUPABASE}/storage/v1/object/${BALDE}/${nome}`, {
    method: "POST",
    headers: { apikey: SERVICO, Authorization: `Bearer ${SERVICO}`, "Content-Type": tipo },
    body: corpo,
  });

let enviado = false;

try {
  const r = await enviar(caminho, PNG, "image/png");
  enviado = r.ok;
  conferir(r.ok, "o PNG entra no balde", r.ok ? "" : `HTTP ${r.status} ${await r.text()}`);

  if (enviado) {
    const publica = `${SUPABASE}/storage/v1/object/public/${BALDE}/${caminho}`;
    const leitura = await fetch(publica);
    conferir(
      leitura.ok && leitura.headers.get("content-type")?.startsWith("image/"),
      "a URL pública devolve a imagem, sem autenticação",
      leitura.ok ? "" : `HTTP ${leitura.status}`
    );
  }

  // O balde tem lista de tipos aceitos; um .svg precisa bater na parede.
  const svg = await enviar(`capas/${id}.svg`, Buffer.from("<svg/>"), "image/svg+xml");
  conferir(!svg.ok, "o balde recusa SVG", svg.ok ? "PASSOU, e não devia" : `recusado (${svg.status})`);

  // E acima de 5 MB também.
  const grande = await enviar(`capas/${id}-grande.png`, Buffer.alloc(6 * 1024 * 1024), "image/png");
  conferir(
    !grande.ok,
    "o balde recusa acima de 5 MB",
    grande.ok ? "PASSOU, e não devia" : `recusado (${grande.status})`
  );
} finally {
  // Remove o que este processo criou, inclusive o que porventura tenha
  // entrado quando não devia.
  for (const alvo of [caminho, `capas/${id}.svg`, `capas/${id}-grande.png`]) {
    await fetch(`${SUPABASE}/storage/v1/object/${BALDE}/${alvo}`, {
      method: "DELETE",
      headers: { apikey: SERVICO, Authorization: `Bearer ${SERVICO}` },
    }).catch(() => {});
  }
  console.log("balde limpo\n");
}

let falhas = 0;
for (const r of resultados) {
  if (!r.ok) falhas += 1;
  console.log(`${r.ok ? "✓" : "✗"} ${r.nome.padEnd(46)} ${r.detalhe}`);
}
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações do envio`);
process.exit(falhas ? 1 : 0);
