# Preparar um projeto Supabase novo

## 1. Criar o projeto

[supabase.com/dashboard](https://supabase.com/dashboard) → **New project**

| Campo | Valor |
|---|---|
| Name | `segreport` |
| Region | **South America (São Paulo)** — os leitores estão no Brasil |
| Database Password | gere uma forte e **guarde**; ela não aparece de novo |

Leva cerca de dois minutos para provisionar.

## 2. Aplicar o esquema

**SQL Editor** → **New query** → colar todo o conteúdo de
[`esquema-completo.sql`](./esquema-completo.sql) → **Run**.

São as migrações do repositório em ordem (nove blocos), num arquivo só. Rode
**uma vez**, num projeto vazio.

Esperado: `Success. No rows returned`. Avisos de `NOTICE` são normais — vêm
dos `if not exists`.

> Este caminho existe para que a senha do banco não precise sair da sua mão.
> A alternativa é `npx supabase db push`, que exige a senha.

### Projeto que já existe: os `ATIVAR-*.sql`

Num projeto que **já tem** o esquema antigo, não rode o `esquema-completo.sql`
de novo. Aplique só o que falta, **nesta ordem** (cada um é seguro de
reexecutar, e o último depende dos dois primeiros):

| Ordem | Arquivo | O que liga |
|---|---|---|
| 1 | [`ATIVAR-INGESTAO.sql`](./ATIVAR-INGESTAO.sql) | tabela de ingestão e a trava contra publicar por fora |
| 2 | [`ATIVAR-VIGIA.sql`](./ATIVAR-VIGIA.sql) | tabelas `pautas` e `vigia_execucoes` |
| 3 | [`ATIVAR-PROCEDENCIA.sql`](./ATIVAR-PROCEDENCIA.sql) | origem, fonte e marca de checagem da matéria |

O terceiro vem **antes do deploy** do código que o usa: sem ele a home, o feed
e o sitemap ficam vazios sem erro nenhum, e toda matéria dá 404. O passo a
passo está em [`docs/integracao/passo-a-passo.md`](../../docs/integracao/passo-a-passo.md).

## 3. Conferir o envio de e-mail

**Authentication → Providers → Email**: `Enable Email provider` ligado,
`Confirm email` ligado.

No plano gratuito o Supabase usa um servidor compartilhado, limitado a poucas
mensagens por hora. Serve para testar. Para produção, configure SMTP próprio
em **Project Settings → Authentication → SMTP Settings**.

**Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (troque pelo domínio quando publicar)
- Redirect URLs: acrescente `http://localhost:3000/auth/confirm`

Sem o segundo, o link do e-mail é recusado como destino inválido.

## 4. Coletar as credenciais

**Project Settings → API**:

| Onde | O quê | Vai para |
|---|---|---|
| Project URL | `https://xxxx.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` | chave pública | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` | chave secreta | `SUPABASE_SERVICE_ROLE_KEY` |

A `service_role` **ignora toda a RLS**. Ela vive só no `.env.local`, que está
no `.gitignore`, e no painel de variáveis do provedor de hospedagem. Nunca em
commit, nunca no navegador.

## 5. Criar a conta de administrador

Com as credenciais no `.env.local`:

```bash
node supabase/setup/criar-admin.mjs seu@email.com "Seu Nome"
```

O script cria a conta, marca `role = 'admin'`, cria a assinatura pública e
envia o link de acesso.

## 6. Entrar

`http://localhost:3000/login` → informe o e-mail → clique no link recebido.
