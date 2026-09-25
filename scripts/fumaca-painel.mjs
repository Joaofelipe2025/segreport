/**
 * Teste de fumaça do painel, com sessão de verdade.
 *
 *   node scripts/fumaca-painel.mjs [http://localhost:3000]
 *
 * A suíte do Vitest cobre lógica pura e RLS em PGlite. O que ela NÃO alcança
 * é o caminho completo: Next renderizando a página, com cookie de sessão, o
 * PostgREST real do outro lado. Foi exatamente aí que o editor quebrou — a
 * consulta pedia uma coluna revogada, e nenhum teste unitário podia ver isso.
 *
 * Entra como o admin usando `generate_link` (não envia e-mail, não gasta a
 * cota do SMTP), guarda os cookies e pede as telas do painel, conferindo que
 * cada uma responde 200 e contém o que deveria conter.
 */
import { readFileSync } from "node:fs";

for (const linha of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const BASE = process.argv[2] ?? "http://localhost:3000";
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.ADMIN_EMAIL ?? "joao.rodrigues.santana@gmail.com";

const potes = new Map();

function guardarCookies(resposta) {
  for (const bruto of resposta.headers.getSetCookie?.() ?? []) {
    const [par] = bruto.split(";");
    const i = par.indexOf("=");
    potes.set(par.slice(0, i), par.slice(i + 1));
  }
}

const cabecalhoDeCookie = () =>
  [...potes].map(([k, v]) => `${k}=${v}`).join("; ");

async function pedir(caminho, opcoes = {}) {
  const r = await fetch(`${BASE}${caminho}`, {
    redirect: "manual",
    ...opcoes,
    headers: { cookie: cabecalhoDeCookie(), ...(opcoes.headers ?? {}) },
  });
  guardarCookies(r);
  return r;
}

async function entrar() {
  const g = await fetch(`${SUPABASE}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: SERVICO,
      Authorization: `Bearer ${SERVICO}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email: EMAIL }),
  });
  const j = await g.json();
  if (!j.hashed_token) throw new Error(`generate_link falhou: ${JSON.stringify(j).slice(0, 200)}`);

  // O próprio /auth/confirm troca o token pela sessão e grava os cookies.
  const r = await pedir(`/auth/confirm?token_hash=${j.hashed_token}&type=magiclink`);
  const destino = r.headers.get("location") ?? "";
  if (!potes.size) throw new Error(`nenhum cookie de sessão. destino=${destino}`);
  return destino;
}

const resultados = [];

async function conferir(nome, caminho, espera) {
  const r = await pedir(caminho);
  const corpo = r.status === 200 ? await r.text() : "";
  const faltando = (espera ?? []).filter((t) => !corpo.includes(t));
  const ok = r.status === 200 && faltando.length === 0;
  resultados.push({ ok, nome, detalhe: ok ? `200` : `${r.status} ${r.headers.get("location") ?? ""} ${faltando.length ? `sem: ${faltando.join(", ")}` : ""}` });
}

const destino = await entrar();
console.log(`sessão estabelecida, /auth/confirm mandou para ${destino}\n`);

await conferir("painel inicial", "/admin", [
  "Como está o acervo",
  "Cobertura por editoria",
  "Mais lidas",
  "Editadas por último",
]);
await conferir("listagem de matérias", "/admin/materias", ["Matérias", "Nova matéria"]);
await conferir("nova matéria (sem gravar)", "/admin/materias/nova", ["Título da matéria"]);
await conferir("colunistas", "/admin/colunistas", ["Colunistas"]);
await conferir("mídia", "/admin/midia", []);
await conferir("ajustes", "/admin/ajustes", ["Sua assinatura", "Estado do sistema"]);

// O editor de uma matéria existente — o caminho que estava quebrado.
const lista = await fetch(
  `${SUPABASE}/rest/v1/articles?select=id&order=updated_at.desc&limit=1`,
  { headers: { apikey: SERVICO, Authorization: `Bearer ${SERVICO}` } }
);
const [primeira] = await lista.json();
if (primeira) {
  await conferir("editor de matéria existente", `/admin/materias/${primeira.id}`, [
    "Título da matéria",
  ]);
} else {
  resultados.push({ ok: true, nome: "editor de matéria existente", detalhe: "nenhuma matéria no banco" });
}

// O portal continua de pé, e o painel não vazou para ele.
await conferir("home do portal", "/", ["SegReport"]);
await conferir("porta da redação", "/painel/entrar", ["Redação"]);

let falhas = 0;
for (const r of resultados) {
  if (!r.ok) falhas += 1;
  console.log(`${r.ok ? "✓" : "✗"} ${r.nome.padEnd(32)} ${r.detalhe}`);
}
console.log(`\n${resultados.length - falhas}/${resultados.length} telas de pé`);
process.exit(falhas ? 1 : 0);
