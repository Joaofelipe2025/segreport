# Conectar o Astra ao SegReport

O Astra redige; **você aprova**. A matéria entra em *Em revisão* e aparece no
primeiro bloco de `/admin`. Nada publica sozinho — nem por erro de
configuração, nem por regressão no código: há uma trava no próprio banco que
recusa matéria publicada vinda de fora do painel.

---

## 1. Antes de tudo: dois passos seus

**No Supabase**, cole `supabase/migrations/20260929000002_ingestao.sql` no
editor SQL. Sem isso o endpoint responde 503 dizendo exatamente qual arquivo
falta, e nada mais do site muda.

Opcionalmente cole também `20260929000003_ingestao_trava_opcional.sql` — é a
trava citada acima. Nada depende dela; ela só impede que um erro futuro no
código quebre a promessa de que nada publica sozinho.

**Na Vercel**, defina `INGESTAO_TOKEN` com uma chave longa:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

> Marque **só Production**. Implantações de preview herdam variáveis, e
> `segreport-<hash>.vercel.app` aceitaria a mesma chave escrevendo no mesmo
> banco de produção.

Para trocar a chave sem derrubar o Astra: ponha a nova em `INGESTAO_TOKEN`, a
antiga em `INGESTAO_TOKEN_ANTERIOR`, atualize o GPT, e depois remova a antiga.

---

## 2. Esquema para colar em *Actions* do GPT

Em **Configure → Actions → Create new action**, cole o esquema abaixo. Em
*Authentication*, escolha **API Key**, tipo **Bearer**, e cole a chave.

Troque `segreport-five.vercel.app` pelo seu domínio quando ele entrar.

```yaml
openapi: 3.1.0
info:
  title: Ingestão de matérias do SegReport
  version: "1.0.0"
servers:
  - url: https://segreport-five.vercel.app
paths:
  /api/ingestao/materias:
    post:
      operationId: enviarMateria
      summary: Envia uma matéria para a fila de revisão do SegReport
      description: >
        Cria a matéria em estado "Em revisão". Ela NÃO é publicada:
        um editor humano revisa e decide. Reenviar exatamente o mesmo
        título e corpo devolve a matéria já criada, sem duplicar.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [titulo, categoria, corpoMarkdown]
              properties:
                titulo:
                  type: string
                  description: Manchete. Mínimo de três caracteres.
                categoria:
                  type: string
                  description: Editoria do portal.
                  enum:
                    - mercado
                    - tecnologia
                    - politica
                    - regulacao
                    - saude
                    - auto
                    - vida
                    - agronegocio
                    - cyber
                    - beneficios
                    - resseguros
                corpoMarkdown:
                  type: string
                  description: >
                    Corpo em Markdown. Permitido: parágrafos, subtítulos com
                    ## e ###, listas, listas numeradas, citações com >,
                    blocos de código e links https. NÃO use imagens nem
                    tabelas.
                linhaDeApoio:
                  type: string
                  description: Uma frase sob a manchete, dizendo o que a matéria acrescenta.
                resumo:
                  type: string
                  description: Resumo curto para a listagem e a home.
                seoTitulo:
                  type: string
                  description: Título para buscador, até 60 caracteres.
                seoDescricao:
                  type: string
                  description: Descrição para buscador, até 160 caracteres.
      responses:
        "201":
          description: Matéria criada e aguardando revisão
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string }
                  estado: { type: string }
                  url: { type: string }
        "200":
          description: Já recebida antes; nada foi duplicado
        "400":
          description: Campo faltando ou inválido
        "422":
          description: O corpo tem algo que o editor não sabe abrir
        "429":
          description: Cota horária atingida
```

Toda recusa volta como `{ "erro": "...", "comoCorrigir": "..." }`. O segundo
campo é escrito para o Astra ler e se corrigir sozinho na tentativa seguinte.

---

## 3. Instrução para colar no Astra

```text
Você redige matérias para o SegReport, veículo de notícias do mercado
segurador brasileiro. Quando terminar uma matéria, envie-a com a ação
enviarMateria.

REGRAS DE FORMATO — o editor do portal só aceita estes blocos:
- parágrafos
- subtítulos com ## e ###
- listas com - e listas numeradas
- citações com >
- blocos de código com ```
- links no formato [texto](https://...)

NUNCA use:
- imagens (![...](...)) — a foto da matéria é a capa, escolhida no painel
- tabelas
- links que não comecem com https:// ou com /

REGRAS EDITORIAIS:
- Escreva em português do Brasil, com acentuação correta.
- Título factual, sem adjetivo de opinião e sem ponto final.
- linhaDeApoio em uma frase: o que a matéria acrescenta a quem já
  conhece o assunto.
- Atribua toda informação à fonte, com nome e cargo quando houver.
- Não invente número, data, citação ou nome de pessoa. Se não souber,
  escreva que não foi possível apurar.
- Não escreva conclusão que a apuração não sustenta.

SE A AÇÃO RECUSAR:
A resposta traz um campo "comoCorrigir". Leia, corrija e reenvie uma vez.
Não reenvie o mesmo conteúdo sem mudar nada.
```

---

## 4. Conferir que funcionou

```bash
curl -X POST https://segreport-five.vercel.app/api/ingestao/materias \
  -H "Authorization: Bearer SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste da integração com o Astra",
    "categoria": "regulacao",
    "linhaDeApoio": "Primeira matéria enviada pela API.",
    "corpoMarkdown": "## Subtítulo\n\nTexto da matéria."
  }'
```

Resposta esperada: `201` com `{"id": "...", "estado": "em_revisao"}`.
Abra `/admin` — ela está na fila de revisão, marcada **não lida**.

Ou rode `node scripts/fumaca-ingestao.mjs`, que faz isso e apaga o que criou.

---

## 5. O que fica registrado

Cada matéria recebida grava uma linha em `ingestao_recebidas`: o id, o título,
quando chegou e um hash do conteúdo.

Duas razões. A primeira é **não duplicar**: se a chamada do Astra expirar e
ele repetir, o hash bate e devolvemos a matéria que já existe. A segunda é
**poder responder depois** à pergunta "quais das nossas matérias foram
redigidas pelo agente?" — a assinatura é sempre "Da Redação" por decisão
editorial sua, então sem esse registro a resposta seria irrecuperável.

O aviso **não lida** na fila usa outro sinal (`updated_by` nulo) e some no
primeiro salvamento — ele responde "alguém já abriu isto?", não "de onde veio".

---

## 6. Limites

| | |
|---|---|
| Matérias por hora | 20 |
| Tamanho do corpo da requisição | 256 KB |
| Tamanho do Markdown | 80.000 caracteres |
| Blocos no documento | 4.000 |

Os dois últimos existem porque a página da matéria é renderizada a cada
visita: um texto desmesurado seria custo permanente numa URL pública, e
revisar não protege — ninguém rola até o parágrafo quatro mil antes de
aprovar o lide.
