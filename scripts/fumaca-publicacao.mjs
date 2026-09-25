/**
 * Prova que o caminho CMS -> portal está ligado.
 *
 *   node scripts/fumaca-publicacao.mjs [http://localhost:3000]
 *
 * Cria uma matéria PRÓPRIA, publica, confere que ela aparece na home, na
 * listagem, na editoria, na página do autor e nela mesma com o texto
 * renderizado — e apaga no fim.
 *
 * A primeira versão deste script sequestrava o rascunho mais antigo do banco,
 * fotografava cinco campos e zerava outros cinco na hora de devolver. Num
 * rascunho com texto, isso APAGAVA o texto — e o `finally` rodava mesmo
 * quando o teste falhava antes de começar. Nunca chegou a destruir nada, por
 * sorte: acertou um rascunho vazio. Criar e apagar o próprio cenário não tem
 * essa aresta, porque não existe estado alheio para restaurar.
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

// Endereço reconhecível e datado: se uma execução morrer no meio, dá para
// achar e remover o resto sem adivinhar qual linha é do script.
const SLUG = `zz-verificacao-automatica-${Date.now().toString(36)}`;
const MARCA = "Texto de verificacao do caminho CMS ate o portal";
const CORPO = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: MARCA }] },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Segundo parágrafo, para o tempo de leitura." }],
    },
  ],
};

const rest = async (caminho, init) => {
  const r = await fetch(`${SUPABASE}/rest/v1/${caminho}`, { headers: h, ...init });
  const t = await r.text();
  if (!r.ok) throw new Error(`${caminho} -> ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
};

const [autor] = await rest("authors?select=id,name,slug&slug=not.is.null&limit=1");
if (!autor) {
  console.log("Nenhum autor cadastrado. Crie a assinatura da redação e rode de novo.");
  process.exit(0);
}
const [categoria] = await rest("categories?select=id,key,label&order=key&limit=1");

console.log(`cenário próprio: /${SLUG}`);
console.log(`  autor: ${autor.name} (/colunistas/${autor.slug})`);
console.log(`  categoria: ${categoria?.label ?? "—"} (/${categoria?.key ?? "—"})\n`);

const resultados = [];
const conferir = async (nome, caminho, ...espera) => {
  const r = await fetch(`${BASE}${caminho}`);
  const corpo = r.status === 200 ? await r.text() : "";
  const faltando = espera.filter((t) => !corpo.includes(t));
  resultados.push({
    ok: r.status === 200 && faltando.length === 0,
    nome,
    detalhe:
      r.status !== 200 ? `HTTP ${r.status}` : faltando.length ? `sem: ${faltando.join(" | ")}` : "ok",
  });
};

let criada = null;

try {
  [criada] = await rest("articles", {
    method: "POST",
    body: JSON.stringify({
      slug: SLUG,
      title: "Verificação automática do caminho CMS",
      standfirst: "Matéria temporária criada e apagada por script de verificação.",
      excerpt: "Matéria temporária criada e apagada por script de verificação.",
      author_id: autor.id,
      category_id: categoria?.id ?? null,
      content_json: CORPO,
      content_text: MARCA,
      reading_time: 1,
      status: "published",
      published_at: new Date().toISOString(),
    }),
  });

  await new Promise((r) => setTimeout(r, 1500));

  await conferir("a matéria abre e mostra o texto", `/noticias/${SLUG}`, MARCA);
  await conferir("aparece na listagem de notícias", "/noticias", "Verificação automática");
  await conferir("aparece na home", "/", "Verificação automática");
  if (categoria) {
    await conferir(
      `aparece na editoria /${categoria.key}`,
      `/${categoria.key}`,
      "Verificação automática"
    );
  }
  await conferir("aparece na página do autor", `/colunistas/${autor.slug}`, "Verificação automática");
} finally {
  // Só apaga o que este processo criou, identificado pelo id devolvido no
  // insert. Sem id não houve criação, e não há nada a remover.
  if (criada?.id) {
    const apagadas = await rest(`articles?id=eq.${criada.id}&select=id`, { method: "DELETE" });
    console.log(
      apagadas?.length
        ? "cenário apagado: a matéria temporária não existe mais\n"
        : `ATENÇÃO: não consegui apagar ${criada.id} (/${SLUG}). Remova à mão.\n`
    );
  }
}

let falhas = 0;
for (const r of resultados) {
  if (!r.ok) falhas += 1;
  console.log(`${r.ok ? "✓" : "✗"} ${r.nome.padEnd(38)} ${r.detalhe}`);
}
console.log(`\n${resultados.length - falhas}/${resultados.length} pontos do caminho ligados`);
process.exit(falhas ? 1 : 0);
