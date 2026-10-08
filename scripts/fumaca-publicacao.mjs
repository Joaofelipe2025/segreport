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
      // A trava de ingestão recusa insert publicado com a chave de serviço;
      // o painel publica por update, então é esse o caminho que se imita.
      status: "draft",
    }),
  });
  [criada] = await rest(`articles?id=eq.${criada.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "published", published_at: new Date().toISOString() }),
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

// ---------------------------------------------------------------------------
// A barreira da marca de checagem, de ponta a ponta.
//
// A suíte unitária prova que `pendenciasParaPublicar` recusa; não prova que
// `mudarEstado` a alimenta com a coluna lida do banco. Trocar
// `linha.precisa_checagem` por `false` passa em tsc, lint e vitest, e
// desliga a única trava entre texto derivado e leitor. Aqui a Server Action é
// chamada de verdade, com sessão de admin.
//
// O passo 4 (publica depois de desmarcar) é o que impede passar por acidente:
// sem ele, recusa por título curto ou categoria faltando contaria como acerto.
// ---------------------------------------------------------------------------
await verificarBarreiraDeChecagem();

async function verificarBarreiraDeChecagem() {
  const slug = `zz-verificacao-checagem-${Date.now().toString(36)}`;
  const potes = new Map();
  const guardar = (r) => {
    for (const bruto of r.headers.getSetCookie?.() ?? []) {
      const [par] = bruto.split(";");
      const i = par.indexOf("=");
      potes.set(par.slice(0, i), par.slice(i + 1));
    }
  };
  const cookie = () => [...potes].map(([k, v]) => `${k}=${v}`).join("; ");
  const registrar = (ok, nome, detalhe) => resultados.push({ ok, nome, detalhe });

  let materia = null;
  try {
    // Sessão de admin sem enviar e-mail.
    const g = await fetch(`${SUPABASE}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        type: "magiclink",
        email: process.env.ADMIN_EMAIL ?? "joao.rodrigues.santana@gmail.com",
      }),
    });
    const j = await g.json();
    if (!j.hashed_token) throw new Error("generate_link falhou");
    guardar(
      await fetch(`${BASE}/auth/confirm?token_hash=${j.hashed_token}&type=magiclink`, {
        redirect: "manual",
      })
    );
    if (!potes.size) throw new Error("sem cookie de sessão");

    // Matéria própria, completa para publicar, já com a marca.
    [materia] = await rest("articles", {
      method: "POST",
      body: JSON.stringify({
        slug,
        title: "Verificação automática da barreira de checagem",
        standfirst: "Matéria temporária criada e apagada por script de verificação.",
        excerpt: "Matéria temporária criada e apagada por script de verificação.",
        author_id: autor.id,
        category_id: categoria?.id ?? null,
        content_json: CORPO,
        content_text: MARCA,
        reading_time: 1,
        status: "draft",
        precisa_checagem: true,
      }),
    });

    // O identificador da Server Action muda a cada build; sai do bundle do editor.
    const pagina = await (
      await fetch(`${BASE}/admin/materias/${materia.id}`, { headers: { cookie: cookie() } })
    ).text();
    const scripts = [...new Set(pagina.match(/\/_next\/static\/[^"'\\ ]+\.js/g) ?? [])];
    let idDaAcao = null;
    for (const src of scripts) {
      const t = await (await fetch(`${BASE}${src}`)).text();
      const m = t.match(/"([0-9a-f]{40,})":\{"name":"mudarEstado"\}/);
      if (m) {
        idDaAcao = m[1];
        break;
      }
    }
    if (!idDaAcao) throw new Error("não achei o identificador da Server Action mudarEstado");

    const publicar = async () => {
      const r = await fetch(`${BASE}/admin/materias/${materia.id}`, {
        method: "POST",
        headers: {
          cookie: cookie(),
          "Next-Action": idDaAcao,
          "Content-Type": "text/plain;charset=UTF-8",
          Accept: "text/x-component",
        },
        body: JSON.stringify([materia.id, "published"]),
      });
      return r.text();
    };
    const situacao = async () =>
      (await rest(`articles?id=eq.${materia.id}&select=status,precisa_checagem`))[0];

    // 2. Marcada: tem de ser recusada, citando a checagem.
    const resposta1 = await publicar();
    // A frase inteira do portão, não só a palavra: um erro de banco que cite
    // a coluna `precisa_checagem` também contém "checagem".
    const recusouPelaMarca = /Antes de publicar:.*confirme a checagem/s.test(resposta1);
    const depois1 = await situacao();
    registrar(
      depois1.status !== "published" && recusouPelaMarca,
      "marcada, a publicação é recusada",
      depois1.status === "published" ? "PUBLICOU matéria marcada" : recusouPelaMarca ? "ok" : `recusa por outro motivo: ${resposta1.slice(0, 160)}`
    );

    // 3. Desmarca direto no banco: o alvo aqui é provar o portão.
    await rest(`articles?id=eq.${materia.id}`, {
      method: "PATCH",
      body: JSON.stringify({ precisa_checagem: false }),
    });

    // 4. Sem a marca, passa — prova que a recusa de antes era pela marca.
    const resposta2 = await publicar();
    const depois2 = await situacao();
    registrar(
      depois2.status === "published",
      "desmarcada, a mesma matéria publica",
      depois2.status === "published" ? "ok" : `continuou ${depois2.status}: ${resposta2.slice(0, 160)}`
    );
  } catch (e) {
    const msg = String(e.message ?? e);
    registrar(
      false,
      "barreira de checagem",
      /precisa_checagem/.test(msg)
        ? "a coluna não existe neste banco: aplique supabase/migrations/20261008000001_procedencia.sql"
        : msg
    );
  } finally {
    // 5. Só o que este processo criou.
    if (materia?.id) {
      const apagadas = await rest(`articles?id=eq.${materia.id}&select=id`, { method: "DELETE" });
      console.log(
        apagadas?.length
          ? "cenário da checagem apagado\n"
          : `ATENÇÃO: não consegui apagar ${materia.id} (/${slug}). Remova à mão.\n`
      );
    }
  }
}

let falhas = 0;
for (const r of resultados) {
  if (!r.ok) falhas += 1;
  console.log(`${r.ok ? "✓" : "✗"} ${r.nome.padEnd(38)} ${r.detalhe}`);
}
console.log(`\n${resultados.length - falhas}/${resultados.length} pontos do caminho ligados`);
process.exit(falhas ? 1 : 0);
