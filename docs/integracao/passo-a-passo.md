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
node scripts/fumaca-ingestao.mjs https://segreport-five.vercel.app
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
