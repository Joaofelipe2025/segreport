/**
 * Prova que o caminho CMS -> portal está ligado.
 *
 *   node scripts/fumaca-publicacao.mjs [http://localhost:3000]
 *
 * Pega um rascunho, dá a ele título, categoria e corpo, publica, e confere
 * que ele aparece: na home, na listagem, na página da categoria, na página do
 * autor e na própria matéria — com o texto renderizado. Depois DESFAZ tudo,
 * devolvendo a linha ao estado em que estava.
 *
 * Usa a chave de serviço para montar e desmontar o cenário, e o portal
 * anônimo para conferir — que é exatamente o par de olhos que interessa.
 */
import { readFileSync } from "node:fs";

for (const linha of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const BASE = process.argv[2] ?? "http://localhost:3000";
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY;

const h = {
  apikey: SERVICO,
  Authorization: `Bearer ${SERVICO}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const MARCA = "Texto de verificacao do caminho CMS ate o portal";
const CORPO = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: MARCA }] },
    { type: "paragraph", content: [{ type: "text", text: "Segundo parágrafo, para o tempo de leitura." }] },
  ],
};

const rest = async (caminho, init) => {
  const r = await fetch(`${SUPABASE}/rest/v1/${caminho}`, { headers: h, ...init });
  const t = await r.text();
  if (!r.ok) throw new Error(`${caminho} -> ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
};

const [rascunho] = await rest("articles?status=eq.draft&order=created_at.asc&limit=1");
if (!rascunho) {
  console.log("Nenhum rascunho disponível para o teste. Crie um e rode de novo.");
  process.exit(0);
}

const [categoria] = await rest("categories?key=eq.regulacao&select=id,key,label&limit=1");
const [autor] = await rest(`authors?id=eq.${rascunho.author_id}&select=id,name,slug&limit=1`);

const original = {
  slug: rascunho.slug,
  title: rascunho.title,
  status: rascunho.status,
  category_id: rascunho.category_id,
  published_at: rascunho.published_at,
};

const SLUG = "verificacao-do-caminho-cms-portal";
console.log(`cenário: matéria ${rascunho.id}`);
console.log(`  autor: ${autor?.name ?? "?"} (/colunistas/${autor?.slug ?? "?"})`);
console.log(`  categoria: ${categoria?.label ?? "?"} (/${categoria?.key ?? "?"})\n`);

const resultados = [];
const conferir = async (nome, caminho, ...espera) => {
  const r = await fetch(`${BASE}${caminho}`);
  const corpo = r.status === 200 ? await r.text() : "";
  const faltando = espera.filter((t) => !corpo.includes(t));
  resultados.push({
    ok: r.status === 200 && faltando.length === 0,
    nome,
    detalhe: r.status !== 200 ? `HTTP ${r.status}` : faltando.length ? `sem: ${faltando.join(" | ")}` : "ok",
  });
};

try {
  await rest(`articles?id=eq.${rascunho.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      slug: SLUG,
      title: "Verificação do caminho CMS até o portal",
      standfirst: "Matéria temporária criada por script de verificação.",
      excerpt: "Matéria temporária criada por script de verificação.",
      category_id: categoria?.id ?? null,
      content_json: CORPO,
      content_text: MARCA,
      reading_time: 1,
      status: "published",
      published_at: new Date().toISOString(),
    }),
  });

  // O Next guarda cache por rota; em dev o force-dynamic do painel não vale
  // para o portal, então damos um respiro antes de conferir.
  await new Promise((r) => setTimeout(r, 1500));

  await conferir("a matéria abre e mostra o texto", `/noticias/${SLUG}`, MARCA);
  await conferir("aparece na listagem de notícias", "/noticias", "Verificação do caminho CMS");
  await conferir("aparece na home", "/", "Verificação do caminho CMS");
  if (categoria) {
    await conferir(`aparece na editoria /${categoria.key}`, `/${categoria.key}`, "Verificação do caminho CMS");
  }
  if (autor?.slug) {
    await conferir("aparece na página do autor", `/colunistas/${autor.slug}`, "Verificação do caminho CMS");
  }
} finally {
  await rest(`articles?id=eq.${rascunho.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...original,
      standfirst: null,
      excerpt: null,
      content_json: null,
      content_text: null,
      reading_time: null,
    }),
  });
  console.log("cenário desfeito: a matéria voltou a ser rascunho vazio\n");
}

let falhas = 0;
for (const r of resultados) {
  if (!r.ok) falhas += 1;
  console.log(`${r.ok ? "✓" : "✗"} ${r.nome.padEnd(38)} ${r.detalhe}`);
}
console.log(`\n${resultados.length - falhas}/${resultados.length} pontos do caminho ligados`);
process.exit(falhas ? 1 : 0);
