#!/usr/bin/env node
/**
 * Cria a conta de administrador do SegReport.
 *
 *   node supabase/setup/criar-admin.mjs seu@email.com "Seu Nome"
 *
 * Usa a chave `service_role`, que ignora a RLS — é a única forma de criar a
 * primeira conta, porque não existe admin ainda para autorizar a operação.
 *
 * Idempotente: rodar de novo com o mesmo e-mail reaproveita a conta e apenas
 * garante o papel e a assinatura pública.
 */

import { readFileSync } from "node:fs";

const [email, nome = "Administrador"] = process.argv.slice(2);

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Uso: node supabase/setup/criar-admin.mjs seu@email.com \"Seu Nome\"");
  process.exit(1);
}

function lerEnv(arquivo) {
  try {
    return Object.fromEntries(
      readFileSync(arquivo, "utf8")
        .split("\n")
        .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

const env = { ...lerEnv(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const chave = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !chave) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local."
  );
  process.exit(1);
}

const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  "Content-Type": "application/json",
};

const slug = nome
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

async function json(resposta) {
  const texto = await resposta.text();
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

console.log(`Projeto: ${url}`);
console.log(`Conta:   ${email}\n`);

// 1. Conta -------------------------------------------------------------------
let userId;

const existentes = await fetch(
  `${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
  { headers: cabecalhos }
).then(json);

const achado = existentes?.users?.find((u) => u.email === email);

if (achado) {
  userId = achado.id;
  console.log(`1. Conta já existia — reaproveitando (${userId.slice(0, 8)}…)`);
} else {
  const criada = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: cabecalhos,
    // email_confirm evita o passo de confirmação: quem roda este script já
    // provou ser dono do projeto ao ter a chave de serviço.
    body: JSON.stringify({ email, email_confirm: true }),
  }).then(json);

  if (!criada?.id) {
    console.error("Falhou ao criar a conta:", JSON.stringify(criada).slice(0, 300));
    process.exit(1);
  }
  userId = criada.id;
  console.log(`1. Conta criada (${userId.slice(0, 8)}…)`);
}

// 2. Perfil com papel de admin ------------------------------------------------
const perfil = await fetch(`${url}/rest/v1/profiles?on_conflict=id`, {
  method: "POST",
  headers: { ...cabecalhos, Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify([{ id: userId, full_name: nome, role: "admin" }]),
}).then(json);

if (!Array.isArray(perfil)) {
  console.error("Falhou ao gravar o perfil:", JSON.stringify(perfil).slice(0, 300));
  console.error("\nO esquema foi aplicado? Veja supabase/setup/README.md, passo 2.");
  process.exit(1);
}
console.log(`2. Perfil marcado como admin`);

// 3. Assinatura pública -------------------------------------------------------
const autor = await fetch(`${url}/rest/v1/authors?on_conflict=profile_id`, {
  method: "POST",
  headers: { ...cabecalhos, Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify([
    { profile_id: userId, name: nome, slug, email, role: "Editor-chefe" },
  ]),
}).then(json);

if (!Array.isArray(autor)) {
  console.error("Aviso — a assinatura pública falhou:", JSON.stringify(autor).slice(0, 300));
  console.error("A conta de admin funciona; você só não consegue assinar matéria.");
} else {
  console.log(`3. Assinatura pública criada — /colunistas/${slug}`);
}

console.log(`\nPronto. Acesse http://localhost:3000/login e peça o link para ${email}.`);
