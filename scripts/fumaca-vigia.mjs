/**
 * Prova a rota do vigia de ponta a ponta.
 *
 *   node scripts/fumaca-vigia.mjs [http://localhost:3000]
 *
 * A rota é a peça central do vigia e a suíte não a alcança — Route Handler
 * não roda em `environment: node`. Este script é a prova que falta, no
 * mesmo molde de `fumaca-ingestao.mjs`.
 *
 * O que ele prova, e por que cada um importa:
 *
 *   • chave errada é recusada;
 *   • lote bom grava, e `novas` diz a verdade;
 *   • REENVIO do mesmo lote devolve `novas: 0` — é a FR-1.4 inteira, e o
 *     comportamento de `ignoreDuplicates` nunca tinha rodado contra um
 *     PostgREST de verdade, só contra a leitura da biblioteca;
 *   • item ruim NÃO derruba os bons, e vira falha registrada;
 *   • lote vazio ainda grava linha de execução, com zero em cada fonte —
 *     é o que distingue "dia calmo" de "os três feeds quebraram".
 *
 * Cria o próprio cenário, com endereço em `fumaca.invalido` (domínio que
 * não existe, então não colide com pauta de verdade), e apaga tudo num
 * `finally` — inclusive as linhas de `vigia_execucoes` que gerou.
 */
import { readFileSync } from "node:fs";

for (const linha of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const BASE = process.argv[2] ?? "http://localhost:3000";
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHAVE = process.env.INGESTAO_TOKEN;

if (!CHAVE) {
  console.log("INGESTAO_TOKEN não está no .env.local. Defina e rode de novo.");
  process.exit(0);
}

const S = { apikey: SERVICO, Authorization: `Bearer ${SERVICO}`, "Content-Type": "application/json" };
const rest = (caminho, init) => fetch(`${SUPABASE}/rest/v1/${caminho}`, { headers: S, ...init });

/** Marca do cenário. Domínio inexistente: nunca bate com pauta real. */
const MARCA = `https://fumaca.invalido/${Date.now().toString(36)}`;

const pauta = (n) => ({
  fonte: "cqcs",
  tipoDeFonte: "imprensa",
  titulo: `Verificação automática do vigia ${n}`,
  url: `${MARCA}/${n}`,
  resumo: "Pauta de verificação, apagada ao fim.",
  publicadoEm: new Date().toISOString(),
});

const enviar = (corpo, chave = CHAVE) =>
  fetch(`${BASE}/api/vigia/execucao`, {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });

const resultados = [];
const conferir = (ok, nome, detalhe = "") => resultados.push({ ok, nome, detalhe });

/** Execuções criadas aqui, para apagar no fim. */
const execucoes = [];

try {
  // ── Recusa ────────────────────────────────────────────────────────────
  const semChave = await enviar({ achados: [] }, "chave-obviamente-errada-mas-longa-o-bastante");
  conferir(semChave.status === 401, "chave errada é recusada", `HTTP ${semChave.status}`);

  // ── A migração está aplicada? ─────────────────────────────────────────
  const sonda = await enviar({ achados: [], falhas: {} });
  if (sonda.status === 503) {
    const corpo = await sonda.json().catch(() => ({}));
    console.log("\nO vigia ainda não foi instalado no banco.");
    console.log(corpo.comoCorrigir ?? "Aplique supabase/setup/ATIVAR-VIGIA.sql no Supabase.");
    console.log("\nSem isso não dá para provar o resto. Aplique e rode de novo.");
    process.exit(1);
  }

  const vazio = await sonda.json();
  if (vazio.execucaoId) execucoes.push(vazio.execucaoId);
  conferir(sonda.status === 201, "lote vazio é aceito", `HTTP ${sonda.status}`);

  // Dia calmo e três feeds quebrados produzem o mesmo vazio em `pautas`.
  // Só esta linha distingue os dois — e ela precisa nomear TODAS as fontes.
  const [linhaVazia] = await (
    await rest(`vigia_execucoes?id=eq.${vazio.execucaoId}&select=achados,falhas`)
  ).json();
  const fontes = Object.keys(linhaVazia?.achados ?? {}).sort();
  conferir(
    fontes.length === 3 && Object.values(linhaVazia.achados).every((n) => n === 0),
    "execução sem achado grava linha com zero em cada fonte",
    fontes.join(", ")
  );

  // ── Caminho feliz ─────────────────────────────────────────────────────
  const lote = { achados: [pauta(1), pauta(2), pauta(3)], falhas: {} };
  const r = await enviar(lote);
  const criada = await r.json();
  if (criada.execucaoId) execucoes.push(criada.execucaoId);
  conferir(
    r.status === 201 && criada.novas === 3 && criada.repetidas === 0,
    "lote de 3 grava 3 pautas novas",
    `HTTP ${r.status} novas=${criada.novas} repetidas=${criada.repetidas}`
  );

  const gravadas = await (
    await rest(`pautas?url=like.${encodeURIComponent(MARCA)}*&select=estado,tipo_de_fonte`)
  ).json();
  conferir(gravadas.length === 3, "as três estão no banco", `${gravadas.length} linha(s)`);
  conferir(
    gravadas.every((p) => p.estado === "nova" && p.tipo_de_fonte === "imprensa"),
    "entram como 'nova' e com o tipo do cadastro"
  );

  // ── Reenvio: a FR-1.4 ─────────────────────────────────────────────────
  const repetido = await enviar(lote);
  const corpoRep = await repetido.json();
  if (corpoRep.execucaoId) execucoes.push(corpoRep.execucaoId);
  conferir(
    repetido.status === 201 && corpoRep.novas === 0 && corpoRep.repetidas === 3,
    "reenvio do mesmo lote não duplica nada",
    `novas=${corpoRep.novas} repetidas=${corpoRep.repetidas}`
  );

  const aindaTres = await (
    await rest(`pautas?url=like.${encodeURIComponent(MARCA)}*&select=id`)
  ).json();
  conferir(aindaTres.length === 3, "continuam sendo três, não seis", `${aindaTres.length}`);

  // ── Item ruim não derruba o lote ──────────────────────────────────────
  // Antes, um único `<link>` relativo numa fonte matava as outras duas E
  // não deixava linha de execução. É o buraco que este caso guarda.
  const misto = {
    achados: [pauta(4), { ...pauta(5), url: "/relativo" }, pauta(6)],
    falhas: { apolice: "HTTP 503" },
  };
  const rm = await enviar(misto);
  const corpoMisto = await rm.json();
  if (corpoMisto.execucaoId) execucoes.push(corpoMisto.execucaoId);
  conferir(
    rm.status === 201 && corpoMisto.novas === 2,
    "item ruim é descartado e os bons entram",
    `HTTP ${rm.status} novas=${corpoMisto.novas}`
  );

  const [linhaMista] = await (
    await rest(`vigia_execucoes?id=eq.${corpoMisto.execucaoId}&select=achados,falhas`)
  ).json();
  // As duas classes de falha convivem na MESMA linha: a da fonte inteira
  // ("apolice: HTTP 503", que o vigia mandou) e a do item recusado, atribuída
  // à fonte DELE — `cqcs`, porque o item disse de onde veio. `_desconhecida`
  // é só para item que não diz, e isso tem teste de unidade em pauta.test.ts.
  //
  // Esta expectativa dizia `_desconhecida` e nunca tinha rodado: a fumaça do
  // vigia foi escrita antes de a migração estar no banco. A primeira execução
  // real mostrou que o teste é que estava errado, não o código.
  conferir(
    !!linhaMista?.falhas?.apolice && !!linhaMista?.falhas?.cqcs,
    "a falha da fonte e o item recusado ficam os dois registrados",
    JSON.stringify(linhaMista?.falhas ?? {})
  );
  conferir(
    linhaMista?.achados?.cqcs === 2,
    "a contagem é de pautas NOVAS, não de itens lidos",
    `cqcs=${linhaMista?.achados?.cqcs}`
  );
} finally {
  await rest(`pautas?url=like.${encodeURIComponent(MARCA)}*`, { method: "DELETE" });
  for (const id of execucoes) {
    await rest(`vigia_execucoes?id=eq.${id}`, { method: "DELETE" });
  }
  // Sobras de execução interrompida: só o que tem a marca do domínio falso.
  await rest("pautas?url=like.https%3A%2F%2Ffumaca.invalido%2F*", { method: "DELETE" });
  console.log("cenário apagado\n");
}

let falhas = 0;
for (const r of resultados) {
  if (!r.ok) falhas += 1;
  console.log(`${r.ok ? "✓" : "✗"} ${r.nome.padEnd(52)} ${r.detalhe}`);
}
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações do vigia`);
process.exit(falhas ? 1 : 0);
