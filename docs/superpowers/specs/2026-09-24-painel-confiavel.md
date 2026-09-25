# Painel confiável — spec

**Data:** 2026-09-24
**Antecede:** `2026-09-22-cms-fundacao-editorial-design.md` (fundação do CMS, já entregue)

---

## Por que esta fase existe

A fundação do CMS foi entregue com 98 testes verdes e o paywall provado
fechado contra REST em produção. Mesmo assim, ao abrir o painel pela primeira
vez, criar uma matéria não funcionava.

A causa não foi falta de teste de RLS. Foi o contrário: a migração que fechou
o paywall revogou `select` na tabela `articles` e reconcedeu coluna a coluna,
deixando `content_json` de fora — correto para o leitor anônimo, e igualmente
aplicado ao admin, que também é `authenticated`. O editor lia a coluna direto
da tabela, recebia `42501`, e o código fazia:

```ts
const { data: materia } = await supabase.from("articles").select(...);
if (!materia) notFound();
```

O `error` foi descartado. Falha de permissão virou "matéria não existe", e o
usuário viu um 404 sem nenhuma pista. A criação funcionava o tempo todo.

**Três lições, e é delas que sai o escopo desta fase:**

1. **Descartar `error` transforma falha em mentira.** O padrão
   `const { data } = await ...` está espalhado pelo painel. Cada ocorrência é
   um 404 ou uma tela vazia esperando para enganar quem usa.
2. **Ausência de dado precisa ser distinguível de ausência de direito.** O
   editor substituía corpo nulo por documento vazio; sem o 404 na frente, o
   primeiro Salvar teria apagado a matéria.
3. **O painel não tem rede de proteção.** Não há fronteira de erro, não há
   aviso de trabalho não salvo, não há confirmação em ação destrutiva, e há
   um item de menu que leva a 404.

## O que esta fase entrega

Um painel em que **errar é visível e nada se perde em silêncio** — e uma porta
de entrada própria para a redação.

Fora de escopo, em planos separados: Flash do Mercado e Eventos (tabelas
novas), e os conteúdos do Hub. Esta fase não cria nenhuma tabela.

---

## FR-1 — Porta própria da redação

**FR-1.1** A redação entra por `/painel/entrar`, endereço distinto do
`/login` dos leitores.

**FR-1.2** A página não tem cabeçalho nem rodapé do portal, não oferece
assinatura e não oferece criação de conta. Fundo escuro (`forest-900`),
aparência de ferramenta, não de publicação.

**FR-1.3** Autenticação por link mágico, como hoje. `shouldCreateUser: false`
e resposta idêntica em sucesso e em falha — quem não é da redação não
descobre quem é, pela resposta da tela.

**FR-1.4** `requirePainel()` e `requireRole()` mandam para `/painel/entrar`,
não para `/login`. Quem é barrado no painel volta para a porta do painel.

**FR-1.5** Cada motivo de recusa tem texto próprio e honesto:

| Código | Texto |
|---|---|
| `sessao` | Sua sessão expirou. Entre de novo. |
| `permissao` | Esta porta é da redação. Sua conta não tem acesso ao painel. |
| `link-expirado` | O link venceu. Peça outro abaixo. |
| `link-invalido` | O link não pôde ser lido. Peça outro abaixo. |

**FR-1.6** `noindex` na página. A porta da redação não entra em buscador.

**CON-1** O `/login` do portal continua existindo e inalterado para leitores e
assinantes.

## FR-2 — Ajustes, no lugar do 404

**FR-2.1** `/admin/ajustes` existe. Hoje está no menu e responde 404 —
confirmado quatro vezes no log do servidor.

**FR-2.2** Mostra e permite editar a própria assinatura pública: nome, bio e
endereço (`slug`) do autor vinculado ao perfil.

**FR-2.3** Mostra, sem permitir editar: e-mail da conta, papel, e o
identificador do autor. São os dados que o suporte pergunta.

**FR-2.4** Bloco de diagnóstico, só para admin: se a função
`article_body_for_edit` responde, quantas categorias existem, e quantas
matérias há em cada estado. É o que responde "o banco está com a migração
certa?" sem abrir o Supabase.

## FR-3 — Painel inicial com o estado da redação

**FR-3.1** `/admin` deixa de ser redirecionamento e passa a mostrar o estado
editorial.

**FR-3.2** Contagem por estado: rascunho, em revisão, agendada, publicada,
arquivada.

**FR-3.3** **Fila de revisão em primeiro lugar.** É o único bloco que exige
ação de alguém: matéria em revisão está parada esperando o admin. Vem antes
de qualquer número.

**FR-3.4** Últimas matérias editadas, com quem editou e quando.

**FR-3.5** Para o colunista, o mesmo painel mostra só o que é dele — sem
truque no código: a RLS já filtra, e o painel apenas conta o que volta.

## FR-4 — Erro deixa de ser engolido

**FR-4.1** Toda leitura do painel que hoje faz `const { data } = await ...`
passa a tratar `error`. Falha de consulta nunca mais vira "não existe".

**FR-4.2** Fronteira de erro em `src/app/(admin)/error.tsx`: mensagem em
português, o texto técnico visível (é uma ferramenta interna, esconder o erro
não protege ninguém) e um caminho de volta.

**FR-4.3** Nenhuma tela do painel renderiza conteúdo editável a partir de
dado que não pôde ser lido.

## FR-5 — O editor não perde trabalho

**FR-5.1** Sair da página com alterações não salvas pede confirmação.

**FR-5.2** Indicador visível de "não salvo" assim que algo muda, e de
"salvo" depois de gravar.

**FR-5.3** As transições de estado (enviar para revisão, publicar, arquivar)
mostram pendência enquanto rodam e desabilitam o botão. Hoje são chamadas
soltas, sem transição: dá para clicar duas vezes.

**FR-5.4** Excluir matéria pede confirmação digitada do título. Excluir é a
única ação do painel sem volta.

## FR-6 — Portão de publicação

**FR-6.1** Publicar exige: título com 3+ caracteres, categoria escolhida,
corpo não vazio e endereço (`slug`) que não seja o provisório
`rascunho-*`.

**FR-6.2** O que falta é listado de uma vez, não um erro por vez.

**FR-6.3** O portão é conveniência de interface. Quem impede de verdade
continua sendo a RLS, que só deixa admin gravar `published`.

---

## NFR

**NFR-1** Nenhuma tabela nova, nenhuma coluna nova. A fase é sobre o que já
existe funcionar.

**NFR-2** A lógica testável mora em módulos puros sob `src/lib/`. A suíte roda
em `environment: node`, sem testing-library: componente React não é testável
neste projeto, então nada de regra de negócio dentro de `.tsx`.

**NFR-3** Nenhum caminho novo pode ler `content`, `content_json`,
`content_text` ou `search_vector` direto da tabela. O corpo sai por
`article_body_json` (leitor) ou `article_body_for_edit` (painel).

**NFR-4** Tipografia e cor seguem o que já está posto: Poppins, negrito só em
caso específico, e lime nunca como texto sobre fundo claro.

**NFR-5** O painel inteiro continua `noindex` e `force-dynamic`.
