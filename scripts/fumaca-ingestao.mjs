/**
 * Prova a ingestão de ponta a ponta.
 *
 *   node scripts/fumaca-ingestao.mjs [http://localhost:3000]
 *
 * Manda uma matéria pelo endpoint como o Astra mandaria, confere que ela caiu
 * na fila de revisão e NÃO está publicada, que o corpo sobrevive à ida e
 * volta, e que o reenvio idêntico não duplica. Apaga tudo no fim — a matéria
 * e a linha de histórico.
 *
 * Confere também as recusas, que são metade do valor do endpoint: chave
 * errada, categoria inexistente, imagem e tabela no corpo.
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

const TITULO = `Verificação automática da ingestão ${Date.now().toString(36)}`;
const MARCA = "Paragrafo que precisa sobreviver a ida e volta.";
const CORPO = `## Um subtitulo\n\n${MARCA}\n\n- primeiro\n- segundo\n\n> Citacao atribuida.`;

const enviar = (corpo, chave = CHAVE) =>
  fetch(`${BASE}/api/ingestao/materias`, {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });

const resultados = [];
const conferir = (ok, nome, detalhe = "") => resultados.push({ ok, nome, detalhe });

const base = { titulo: TITULO, categoria: "regulacao", corpoMarkdown: CORPO };
let id = null;

try {
  // ── Recusas ───────────────────────────────────────────────────────────
  const semChave = await enviar(base, "chave-obviamente-errada-mas-longa-o-suficiente");
  conferir(semChave.status === 401, "chave errada é recusada", `HTTP ${semChave.status}`);

  const catRuim = await enviar({ ...base, categoria: "economia" });
  const corpoCat = await catRuim.json();
  conferir(
    catRuim.status === 400 && String(corpoCat.comoCorrigir).includes("regulacao"),
    "categoria inválida diz quais existem",
    corpoCat.comoCorrigir?.slice(0, 50) ?? ""
  );

  const comImagem = await enviar({ ...base, corpoMarkdown: "![foto](https://x.com/a.png)" });
  const corpoImg = await comImagem.json();
  conferir(
    comImagem.status === 422 && /capa/i.test(String(corpoImg.comoCorrigir)),
    "imagem no corpo é recusada, mandando usar a capa",
    `HTTP ${comImagem.status}`
  );

  const comTabela = await enviar({ ...base, corpoMarkdown: "| a | b |\n|---|---|\n| 1 | 2 |" });
  conferir(comTabela.status === 422, "tabela é recusada", `HTTP ${comTabela.status}`);

  // ── Caminho feliz ─────────────────────────────────────────────────────
  const r = await enviar(base);
  const criada = await r.json();
  id = criada.id;
  conferir(r.status === 201 && !!id, "matéria criada", `HTTP ${r.status} ${criada.erro ?? ""}`);

  if (id) {
    const [linha] = await (await rest(`articles?id=eq.${id}&select=status,slug,updated_by,reading_time,author_id`)).json();
    conferir(linha?.status === "in_review", "entrou EM REVISÃO, não publicada", `status=${linha?.status}`);
    conferir(linha?.updated_by === null, "marcada como não lida por ninguém");
    conferir((linha?.reading_time ?? 0) > 0, "tempo de leitura calculado", `${linha?.reading_time} min`);

    const [autor] = await (await rest(`authors?id=eq.${linha.author_id}&select=name,slug`)).json();
    conferir(autor?.slug === "da-redacao", "assinada pela redação", autor?.name ?? "—");

    // O corpo sobreviveu?
    const corpoVolta = await (
      await fetch(`${SUPABASE}/rest/v1/rpc/article_body_json`, {
        method: "POST",
        headers: S,
        body: JSON.stringify({ p_slug: linha.slug }),
      })
    ).json();
    conferir(JSON.stringify(corpoVolta).includes(MARCA), "o texto sobreviveu à ida e volta");

    // Reenvio idêntico não duplica.
    const repetido = await enviar(base);
    const corpoRep = await repetido.json();
    conferir(
      repetido.status === 200 && corpoRep.id === id,
      "reenvio idêntico devolve a mesma matéria",
      `HTTP ${repetido.status} estado=${corpoRep.estado}`
    );

    // Corpo diferente com o mesmo título é matéria NOVA, não duplicata.
    const corrigida = await enviar({ ...base, corpoMarkdown: `${CORPO}\n\nParagrafo corrigido.` });
    const corpoCorr = await corrigida.json();
    conferir(
      corrigida.status === 201 && corpoCorr.id !== id,
      "reenvio CORRIGIDO cria matéria nova, não é descartado",
      `HTTP ${corrigida.status}`
    );
    if (corpoCorr.id) {
      await rest(`ingestao_recebidas?article_id=eq.${corpoCorr.id}`, { method: "DELETE" });
      await rest(`articles?id=eq.${corpoCorr.id}`, { method: "DELETE" });
    }
  }
} finally {
  if (id) {
    await rest(`ingestao_recebidas?article_id=eq.${id}`, { method: "DELETE" });
    await rest(`articles?id=eq.${id}`, { method: "DELETE" });
  }
  // Sobras de execução interrompida.
  await rest(`articles?title=like.Verifica%C3%A7%C3%A3o%20autom%C3%A1tica%20da%20ingest%C3%A3o*`, { method: "DELETE" });
  console.log("cenário apagado\n");
}

let falhas = 0;
for (const r of resultados) {
  if (!r.ok) falhas += 1;
  console.log(`${r.ok ? "✓" : "✗"} ${r.nome.padEnd(48)} ${r.detalhe}`);
}
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações da ingestão`);
process.exit(falhas ? 1 : 0);
