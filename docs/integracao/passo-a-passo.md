# Ativar a ingestão — o que falta

Eu já fiz tudo que dá para fazer sem a sua senha do banco:

| | |
|---|---|
| ✅ Código | no ar em produção |
| ✅ `INGESTAO_TOKEN` na Vercel | criada, como **Secret**, **só em Production** |
| ✅ Vínculo errado da CLI do Supabase | removido — apontava para o projeto abandonado `bxrobsosqldmvkchwqnj` |
| ⬜ **Tabela no banco** | **só você** — precisa de DDL, e nenhuma chave que eu tenho executa DDL |

Sobra **um passo**. Leva um minuto.

---

## Passo único: colar o SQL

1. Abra o Supabase, projeto **`hdzfleptasoepfsalqad`**
   (confira o endereço — há outro projeto antigo chamado SEGREPORTS que **não** é este)
2. Menu lateral → **SQL Editor** → **New query**
3. Abra o arquivo **`supabase/setup/ATIVAR-INGESTAO.sql`** — é o que termina em **.sql**, não este guia — copie tudo, cole e clique em **Run**

É seguro rodar mais de uma vez. Já validei o arquivo aplicando num Postgres limpo.

### O que você deve ver

Três linhas, todas `ok`:

```
item                              estado
────────────────────────────────  ──────
tabela de ingestão                ok
trava contra publicar por fora    ok
só admin lê o histórico           ok
```

Se alguma disser `FALTOU`, me mande a mensagem de erro.

---

## Pegar a chave do Astra

Ela está no seu `.env.local`, na linha `INGESTAO_TOKEN=`. É a mesma que
subi para a Vercel.

```bash
grep INGESTAO_TOKEN .env.local
```

---

## Conferir que funcionou

```bash
node scripts/fumaca-ingestao.mjs https://www.segreport.com.br
```

Esperado: **5/5**. Ele cria uma matéria de teste, confere que entrou em
revisão e não publicada, que o texto sobreviveu, que reenvio idêntico não
duplica e que reenvio corrigido cria matéria nova — e apaga tudo no fim.

Antes de você colar o SQL, esse script dá **4/5**, com a quinta falhando em
`503 — Aplique a migração`. É o comportamento correto.

---

## Ligar o Astra

Tudo pronto em [`astra.md`](./astra.md):

1. No GPT: **Configure → Actions → Create new action**
2. Cole o esquema OpenAPI de lá
3. Em *Authentication*: **API Key**, tipo **Bearer**, cole a chave
4. Cole o bloco de instruções no campo de instruções do GPT

Peça uma matéria de teste e abra `/admin` — ela estará na fila de revisão,
marcada **não lida**.

---

## Se precisar trocar a chave depois

Sem apagão: ponha a nova em `INGESTAO_TOKEN`, mova a antiga para
`INGESTAO_TOKEN_ANTERIOR`, atualize o GPT, e só então apague a antiga. O
endpoint aceita as duas durante a troca.

---

## O vigia de fontes

Roda no GitHub Actions, três vezes ao dia. Antes dos cadastros do GitHub, tem
um passo de banco — o mesmo tipo de passo da ingestão, porque é DDL e nenhuma
chave que eu tenho executa DDL:

1. **Passo único de banco:** Supabase, projeto **`hdzfleptasoepfsalqad`** →
   **SQL Editor** → **New query** → abra **`supabase/setup/ATIVAR-VIGIA.sql`**
   — termina em **.sql**, não este guia — copie tudo, cole e clique em **Run**.
   Sem isso a rota do vigia responde 503 três vezes por dia, para sempre.
2. **Settings → Secrets and variables → Actions → New repository secret**
   Nome `INGESTAO_TOKEN`, valor igual ao que está na Vercel.
3. Na aba **Variables** da mesma tela, `SEGREPORT_URL` com o endereço do site.

Para rodar na hora, sem esperar o horário: **Actions → Vigia de fontes → Run
workflow**.

O painel, em **Pautas**, mostra quando ele rodou pela última vez e o que
falhou. Se aparecer aviso vermelho, o vigia parou.

---

## A procedência da matéria — ANTES do deploy

Este é o passo que a regra "não quero plágio, apenas inspiração" exige no
banco. É DDL — o mesmo tipo de passo da ingestão e do vigia — e **vem antes do
deploy**, não depois.

**Por que a ordem importa:** o portal passou a pedir ao banco as colunas de
crédito (`origem`, `fonte_original_url`, `fonte_original_nome`). Com o código
no ar e o SQL ainda sem rodar, a consulta pública falha e o portal **não dá
erro nenhum**: a home, as editorias, o feed e o sitemap ficam **vazios**, e
toda matéria responde 404. O painel, ao contrário, grita 500 — o portal só
fica em silêncio. E o Next pode guardar a home vazia em cache.

1. Abra o Supabase, projeto **`hdzfleptasoepfsalqad`**.
2. **SQL Editor** → **New query** → abra **`supabase/setup/ATIVAR-PROCEDENCIA.sql`**
   — termina em **.sql**, não este guia — copie tudo, cole e clique em **Run**.
3. Confira as oito linhas abaixo. Só então faça o deploy.

É seguro rodar mais de uma vez. O arquivo roda numa transação só (`begin` /
`commit`): ou entra tudo, ou nada. **Cole o arquivo inteiro**, nunca uma
seleção — um `revoke` rodado sozinho deixa o portal sem permissão de leitura.

Pré-requisito: `ATIVAR-INGESTAO.sql` e `ATIVAR-VIGIA.sql` já aplicados (este
arquivo altera a tabela `pautas`, que vem do vigia).

### O que você deve ver

Oito linhas, todas `ok`:

```
item                                                        estado
──────────────────────────────────────────────────────────  ──────
colunas de procedencia em articles                          ok
restricao articles_derivada_tem_fonte                       ok
restricao articles_fonte_eh_http                            ok
precisa_checagem legivel pelo painel (authenticated)        ok
precisa_checagem fechada ao publico (anon)                  ok
carimbo updated_at em pautas (a reserva precisa expirar)    ok
credito da fonte legivel pelo publico (anon)                ok
pautas_estado_check aceita em_producao                      ok
```

Se alguma disser `FALTOU`, me mande a mensagem de erro **e não faça o deploy**.
