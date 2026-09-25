/**
 * Valida `esquema-completo.sql` num Postgres limpo.
 *
 *   node supabase/setup/validar.mjs
 *
 * Existe porque este arquivo é o que se cola no editor SQL do Supabase — e,
 * ao contrário das migrações, ele não passa pela suíte de testes. Já houve
 * pelo menos uma vez em que o pacote ficou atrás das migrações sem ninguém
 * notar: quem instalasse do zero recebia um banco diferente do de produção.
 *
 * Reaproveita o shim de `tests/helpers/db.ts` para não manter duas cópias da
 * imitação do `auth` do Supabase.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const fonte = readFileSync("tests/helpers/db.ts", "utf8");
const shim = fonte.match(/const SUPABASE_SHIM = `([\s\S]*?)\n`;/);
if (!shim) {
  throw new Error("Não achei o SUPABASE_SHIM em tests/helpers/db.ts — o formato mudou?");
}

const pg = new PGlite();
await pg.exec(shim[1]);

try {
  await pg.exec(readFileSync("supabase/setup/esquema-completo.sql", "utf8"));
} catch (causa) {
  console.error("✗ O pacote de instalação NÃO aplica num banco limpo:");
  console.error(`  ${causa.message}`);
  process.exit(1);
}

const um = async (sql) => (await pg.query(sql)).rows;

const tabelas = await um("select tablename from pg_tables where schemaname='public' order by 1");
const politicas = await um("select count(*)::int n from pg_policies where schemaname='public'");
const funcoes = await um(
  `select proname from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' order by 1`
);
const categorias = await um("select key from public.categories order by key");

console.log(`✓ Aplica num banco limpo`);
console.log(`  tabelas    ${tabelas.length}: ${tabelas.map((r) => r.tablename).join(", ")}`);
console.log(`  políticas  ${politicas[0].n}`);
console.log(`  funções    ${funcoes.map((r) => r.proname).join(", ")}`);
console.log(`  categorias ${categorias.map((r) => r.key).join(", ")}`);

await pg.close();
