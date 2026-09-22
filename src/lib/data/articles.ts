import type { Article } from "@/lib/types";
import { photo } from "./media";

/**
 * Notícias fictícias do preview.
 *
 * As manchetes reproduzem as do protótipo para que o layout seja avaliado
 * com comprimento de título realista — manchete curta demais esconde
 * problemas de quebra de linha que aparecem em produção.
 */
export const ARTICLES: Article[] = [
  {
    slug: "seguradoras-investem-ia-analise-sinistros",
    title: "Seguradoras investem em IA para acelerar análise de sinistros",
    standfirst:
      "Tecnologia promete reduzir tempo de análise de sinistros em até 70%, mas esbarra na qualidade do dado histórico das carteiras.",
    category: "tecnologia",
    authorSlug: "rodrigo-teixeira",
    publishedAt: "2026-09-22T08:30:00-03:00",
    readingMinutes: 6,
    image: photo("ia-sinistros", 1400, 900),
    imageAlt: "Robô humanoide branco em ambiente de escritório",
    featured: "lead",
    tags: ["inteligência artificial", "sinistros", "automação"],
    body: [
      "As cinco maiores seguradoras do país já operam algum modelo de linguagem na triagem inicial de sinistros, segundo levantamento do SegReport junto a executivos de operações. O ganho declarado é consistente: o que levava de três a cinco dias úteis para receber uma primeira classificação agora sai em horas.",
      "O entusiasmo, porém, encontra um limite conhecido. Modelos aprendem com histórico, e o histórico de sinistro no Brasil é fragmentado entre sistemas legados, planilhas de regulação e laudos digitalizados sem estrutura. Uma diretora de operações ouvida pela reportagem resume: a IA acelerou a parte que já era rápida, e a parte lenta continua sendo obter o documento do segurado.",
      "Há também a questão regulatória. A SUSEP ainda não publicou orientação específica sobre decisão automatizada em sinistro, e o entendimento predominante no mercado é conservador: o modelo sugere, um analista humano decide. Nenhuma das empresas consultadas admite negar sinistro sem revisão humana.",
      "O efeito mais concreto até aqui aparece em fraude. Modelos de detecção cruzando histórico de oficina, padrão de acionamento e geolocalização elevaram a taxa de identificação em carteiras de auto, segundo três das companhias consultadas — ainda que nenhuma tenha aberto o número.",
      "Para 2027, a expectativa do setor é que o ganho migre da triagem para a regulação propriamente dita, com laudo assistido por visão computacional em sinistros de baixa complexidade.",
    ],
  },
  {
    slug: "open-insurance-nova-fase",
    title: "Open Insurance entra em nova fase e promete acirrar concorrência",
    standfirst:
      "Implementação do sistema de compartilhamento de dados regulado pela SUSEP amplia a portabilidade e muda o jogo da retenção de carteira.",
    category: "mercado",
    authorSlug: "helena-braga",
    publishedAt: "2026-09-22T07:10:00-03:00",
    readingMinutes: 7,
    image: photo("open-insurance", 1200, 800),
    imageAlt: "Duas profissionais em reunião de negócios",
    featured: "secondary",
    tags: ["open insurance", "susep", "portabilidade"],
    body: [
      "A segunda fase do Open Insurance entra em vigor com a promessa de tornar a troca de seguradora tão simples quanto trocar de banco. Na prática, o segurado passa a poder autorizar o compartilhamento do próprio histórico — incluindo sinistralidade — com um concorrente.",
      "Para quem tem carteira madura e boa experiência de atendimento, é oportunidade. Para quem retém cliente por atrito, é ameaça direta. O consenso entre os executivos ouvidos é que a régua de qualidade de serviço vai subir rápido.",
      "O ponto de atenção está na assimetria: seguradoras com estrutura de dados moderna conseguem consumir o histórico compartilhado e precificar melhor no mesmo dia. As que dependem de sistema legado vão receber o dado e não saber o que fazer com ele.",
    ],
  },
  {
    slug: "mercado-segurador-crescimento-dois-digitos",
    title:
      "Mercado segurador projeta crescimento de dois dígitos para próximo trimestre",
    standfirst:
      "Setor de seguros mostra resiliência e expectativas positivas para o fechamento do ano, puxado por saúde e benefícios.",
    category: "mercado",
    authorSlug: "marcos-vilela",
    publishedAt: "2026-09-21T16:45:00-03:00",
    readingMinutes: 5,
    image: photo("crescimento-mercado", 1200, 800),
    imageAlt: "Painel de indicadores financeiros em notebook",
    featured: "secondary",
    tags: ["prêmios", "resultados", "projeção"],
    body: [
      "A arrecadação consolidada do setor deve fechar o trimestre com alta de dois dígitos na comparação anual, sustentada principalmente pelos ramos de saúde e benefícios corporativos.",
      "O número, porém, carrega inflação médica embutida. Descontado o reajuste, o crescimento real de vidas cobertas é bem mais modesto — e é esse o indicador que mede expansão de mercado de verdade.",
    ],
  },
  {
    slug: "nova-regulamentacao-ans-planos-saude",
    title: "Nova regulamentação da ANS impacta planos de saúde",
    standfirst:
      "Mudanças entram em vigor em março e afetam diretamente os reajustes de contratos coletivos.",
    category: "saude",
    authorSlug: "carla-mendonca",
    publishedAt: "2026-09-21T14:20:00-03:00",
    readingMinutes: 6,
    image: photo("ans-regulacao", 900, 700),
    imageAlt: "Estetoscópio sobre mesa de trabalho com notebook",
    featured: "strip",
    tags: ["ans", "reajuste", "coletivos"],
    body: [
      "A nova resolução altera a metodologia de cálculo do reajuste de planos coletivos com menos de trinta vidas, agrupando contratos para diluir a sinistralidade individual.",
      "Operadoras alegam que o agrupamento compulsório distorce a precificação de carteiras pequenas com uso atípico. Entidades de defesa do consumidor respondem que a dispersão é justamente o objetivo do pool de risco.",
    ],
  },
  {
    slug: "cyber-seguro-cresce-40-por-cento",
    title: "Cyber seguro cresce 40% com aumento de ataques",
    standfirst:
      "Empresas de médio porte lideram nova onda de contratações de proteção digital após série de incidentes com ransomware.",
    category: "cyber",
    authorSlug: "tatiana-alencar",
    publishedAt: "2026-09-21T11:05:00-03:00",
    readingMinutes: 5,
    image: photo("cyber-seguro", 900, 700),
    imageAlt: "Placa de circuito eletrônico em tons de ciano",
    featured: "strip",
    tags: ["cyber", "ransomware", "lgpd"],
    body: [
      "A procura por apólices de risco cibernético saltou no segmento de empresas com faturamento entre R$ 50 milhões e R$ 300 milhões, faixa que até recentemente considerava o produto caro demais.",
      "A mudança tem causa direta: incidentes de ransomware em fornecedores de software de gestão atingiram centenas de clientes de uma vez, e a conta da paralisação ficou visível para o conselho.",
      "Subscritores, por sua vez, endureceram. Questionário de contratação passou a exigir autenticação multifator, backup imutável e plano de resposta testado. Sem isso, a cotação simplesmente não sai.",
    ],
  },
  {
    slug: "seguro-auto-queda-sinistralidade",
    title: "Seguro auto registra queda nos índices de sinistralidade",
    standfirst:
      "Dados do primeiro semestre mostram redução significativa nos acidentes e alívio na margem das carteiras.",
    category: "auto",
    authorSlug: "redacao",
    publishedAt: "2026-09-20T18:30:00-03:00",
    readingMinutes: 4,
    image: photo("auto-sinistralidade", 900, 700),
    imageAlt: "Avenida movimentada entre prédios altos",
    featured: "strip",
    tags: ["auto", "sinistralidade", "frota"],
    body: [
      "A sinistralidade do ramo auto recuou para 58,3% no acumulado do semestre, ante 61,1% no mesmo período do ano anterior.",
      "A queda combina três fatores: adoção de telemetria em frotas, envelhecimento da carteira segurada e aumento do valor médio da franquia, que reduz acionamento de sinistro de baixa monta.",
    ],
  },
  {
    slug: "ia-generativa-subscricao-riscos",
    title: "IA Generativa transforma subscrição de riscos",
    standfirst:
      "Modelos de linguagem avançados auxiliam na análise de propostas complexas de grandes riscos.",
    category: "tecnologia",
    authorSlug: "rodrigo-teixeira",
    publishedAt: "2026-09-20T15:00:00-03:00",
    readingMinutes: 7,
    image: photo("ia-generativa", 900, 700),
    imageAlt: "Letras AI iluminadas em azul sobre fundo escuro",
    featured: "strip",
    minTier: "pro",
    tags: ["subscrição", "grandes riscos", "ia"],
    body: [
      "Em grandes riscos, a análise de uma proposta envolve ler centenas de páginas de laudo, contrato e especificação técnica. É exatamente o tipo de trabalho em que modelo de linguagem economiza tempo real do subscritor sênior.",
      "O que as companhias relatam é um ganho de triagem: o modelo resume, aponta cláusula fora do padrão e sinaliza exposição não declarada. A decisão de aceitar e a definição de taxa seguem humanas.",
    ],
  },
  {
    slug: "fusoes-aquisicoes-corretagem",
    title: "Fusões e aquisições movimentam setor de corretagem de seguros",
    standfirst:
      "Consolidação do mercado ganha força com três grandes operações anunciadas no trimestre.",
    category: "mercado",
    authorSlug: "marcos-vilela",
    publishedAt: "2026-09-20T09:40:00-03:00",
    readingMinutes: 6,
    image: photo("fusoes-corretagem", 900, 700),
    imageAlt: "Profissional assinando documento sobre a mesa",
    featured: "strip",
    tags: ["m&a", "corretagem", "consolidação"],
    body: [
      "Três operações relevantes de aquisição de corretoras regionais foram anunciadas no trimestre, todas conduzidas por grupos com capital de fundo de investimento.",
      "A lógica é conhecida: comprar carteira pulverizada, centralizar backoffice e renegociar comissionamento com a seguradora a partir de um volume maior.",
      "O risco menos discutido é a rotatividade do relacionamento. Boa parte da carteira de corretora regional está no corretor, não na marca — e quando o corretor sai, a carteira costuma ir junto.",
    ],
  },
  {
    slug: "seguro-vida-novos-formatos",
    title: "Seguro de vida ganha novos formatos e coberturas",
    standfirst:
      "Produtos modulares e contratação por assinatura mensal avançam sobre o público jovem.",
    category: "vida",
    authorSlug: "redacao",
    publishedAt: "2026-09-19T17:15:00-03:00",
    readingMinutes: 4,
    image: photo("seguro-vida", 600, 400),
    imageAlt: "Documento de apólice sobre escrivaninha",
    tags: ["vida", "produto", "distribuição"],
    body: [
      "Apólices de vida com cobertura modular — em que o segurado escolhe e troca coberturas pelo aplicativo — passaram a responder por parcela relevante da venda digital.",
      "O ticket médio é baixo, mas a persistência tem surpreendido: cancelamento no primeiro ano ficou abaixo do observado na venda tradicional por telefone.",
    ],
  },
  {
    slug: "susep-seguros-parametricos",
    title: "SUSEP e seguros paramétricos ganham destaque",
    standfirst:
      "Regulador sinaliza abertura para produtos de gatilho objetivo, sem necessidade de regulação de sinistro.",
    category: "regulacao",
    authorSlug: "helena-braga",
    publishedAt: "2026-09-19T13:50:00-03:00",
    readingMinutes: 6,
    image: photo("susep-parametricos", 600, 400),
    imageAlt: "Estátua da justiça em mármore",
    tags: ["susep", "paramétrico", "inovação"],
    body: [
      "Seguro paramétrico paga a partir de um índice objetivo — milímetros de chuva, magnitude sísmica, horas de interrupção — e dispensa a regulação tradicional de sinistro.",
      "A vantagem é velocidade: indenização em dias em vez de meses. A dificuldade é o risco de base, quando o gatilho dispara mas o prejuízo não aconteceu, ou o contrário.",
    ],
  },
  {
    slug: "seguro-agricola-incertezas-climaticas",
    title: "Seguro agrícola ganha força diante de incertezas climáticas",
    standfirst:
      "Eventos extremos mais frequentes elevam a demanda e forçam reavaliação dos modelos de risco rural.",
    category: "agronegocio",
    authorSlug: "juliana-sato",
    publishedAt: "2026-09-19T10:25:00-03:00",
    readingMinutes: 7,
    image: photo("seguro-agricola", 600, 400),
    imageAlt: "Plantação ao pôr do sol",
    tags: ["agro", "clima", "paramétrico"],
    body: [
      "A série histórica que sustenta a precificação do seguro rural pressupõe estabilidade climática — premissa que a última década desmontou.",
      "Seguradoras estão encurtando a janela de dados usada no modelo, dando mais peso aos anos recentes. Isso encarece o produto, mas reduz o risco de subprecificar uma safra inteira.",
    ],
  },
  {
    slug: "operadoras-saude-redes-credenciadas",
    title: "Operadoras de saúde ampliam redes credenciadas em 15%",
    standfirst:
      "Expansão concentrada em cidades médias busca reduzir custo de deslocamento e sinistro de alta complexidade.",
    category: "saude",
    authorSlug: "carla-mendonca",
    publishedAt: "2026-09-18T16:00:00-03:00",
    readingMinutes: 5,
    image: photo("redes-credenciadas", 600, 400),
    imageAlt: "Corredor de hospital com leitos",
    tags: ["saúde", "rede credenciada", "operadoras"],
    body: [
      "O movimento de credenciamento em cidades médias responde a um cálculo simples: tratar localmente custa menos que transferir o paciente para a capital.",
      "A contrapartida é a negociação de tabela. Prestador regional sem concorrência próxima tem poder de barganha maior do que a operadora gostaria.",
    ],
  },
  {
    slug: "carros-eletricos-coberturas-especificas",
    title: "Carros elétricos ganham coberturas específicas",
    standfirst:
      "Bateria responde por até 40% do valor do veículo e passa a ter cláusula própria nas apólices.",
    category: "auto",
    authorSlug: "redacao",
    publishedAt: "2026-09-18T11:30:00-03:00",
    readingMinutes: 4,
    image: photo("carros-eletricos", 600, 400),
    imageAlt: "Carro elétrico conectado ao carregador",
    tags: ["auto", "elétricos", "bateria"],
    body: [
      "A bateria mudou a economia do sinistro de auto. Num veículo elétrico, um impacto que antes seria perda parcial pode condenar o pacote de baterias e levar à perda total.",
      "Seguradoras responderam com cláusula específica e rede de oficina certificada, ainda escassa fora dos grandes centros.",
    ],
  },
  {
    slug: "telemedicina-planos-saude",
    title: "Telemedicina consolida espaço nos planos de saúde",
    standfirst:
      "Consulta remota deixa de ser diferencial e vira item obrigatório na negociação de contratos corporativos.",
    category: "saude",
    authorSlug: "carla-mendonca",
    publishedAt: "2026-09-17T15:10:00-03:00",
    readingMinutes: 5,
    image: photo("telemedicina", 600, 400),
    imageAlt: "Cápsulas de medicamento sobre superfície clara",
    tags: ["telemedicina", "saúde", "corporativo"],
    body: [
      "A teleconsulta se firmou como porta de entrada. O efeito sobre custo é ambíguo: reduz pronto-socorro desnecessário, mas aumenta o volume total de atendimentos.",
      "Operadoras que mediram o efeito líquido relatam economia modesta, concentrada em especialidades de acompanhamento.",
    ],
  },
  {
    slug: "telemetria-iot-reduzem-premios",
    title: "Telemetria e IoT reduzem prêmios em até 25%",
    standfirst:
      "Programas de pontuação de direção ganham adesão em frotas corporativas e começam a chegar ao varejo.",
    category: "auto",
    authorSlug: "rodrigo-teixeira",
    publishedAt: "2026-09-17T09:00:00-03:00",
    readingMinutes: 6,
    image: photo("telemetria-iot", 600, 400),
    imageAlt: "Profissional operando equipamento de diagnóstico",
    tags: ["telemetria", "iot", "frota"],
    body: [
      "O desconto por comportamento de direção saiu do piloto e virou produto. Em frota, a adesão é simples: o contratante é a empresa, e o ganho aparece no prêmio da renovação.",
      "No varejo, a barreira é privacidade. Parte relevante dos segurados recusa o monitoramento mesmo com desconto declarado.",
    ],
  },
  {
    slug: "lucro-liquido-setor-sobe-15",
    title: "Lucro líquido do setor sobe 15% no acumulado do ano",
    standfirst:
      "Resultado financeiro das reservas sustenta a margem enquanto o resultado operacional segue pressionado.",
    category: "mercado",
    authorSlug: "marcos-vilela",
    publishedAt: "2026-09-16T17:45:00-03:00",
    readingMinutes: 5,
    image: photo("lucro-setor", 600, 400),
    imageAlt: "Gráficos financeiros em tela de computador",
    minTier: "pro",
    tags: ["resultados", "lucro", "reservas"],
    body: [
      "O lucro consolidado cresceu, mas a composição merece atenção: boa parte veio do resultado financeiro das reservas técnicas, não da operação de seguro.",
      "Em cenário de juros em queda, essa fonte encolhe — e a pressão sobre o índice combinado volta a aparecer no resultado.",
    ],
  },
  {
    slug: "resseguro-capacidade-global",
    title: "Capacidade de resseguro global aperta e pressiona grandes riscos",
    standfirst:
      "Renovação de janeiro deve chegar com taxa mais alta e retenção maior para as cedentes brasileiras.",
    category: "resseguros",
    authorSlug: "paulo-rivera",
    publishedAt: "2026-09-16T10:20:00-03:00",
    readingMinutes: 7,
    image: photo("resseguro-capacidade", 600, 400),
    imageAlt: "Vista aérea de complexo industrial",
    tags: ["resseguro", "capacidade", "renovação"],
    body: [
      "A capacidade disponível para risco catastrófico encolheu no mercado internacional, e o Brasil não está isolado desse ciclo.",
      "A consequência prática para a cedente local é dupla: taxa de resseguro mais alta e exigência de reter uma fatia maior do risco no próprio balanço.",
    ],
  },
  {
    slug: "beneficios-corporativos-saude-mental",
    title: "Benefícios corporativos incorporam saúde mental como item central",
    standfirst:
      "Afastamentos por transtornos mentais lideram estatística e mudam o desenho dos pacotes.",
    category: "beneficios",
    authorSlug: "carla-mendonca",
    publishedAt: "2026-09-15T14:00:00-03:00",
    readingMinutes: 5,
    image: photo("saude-mental", 600, 400),
    imageAlt: "Ambiente de escritório com luz natural",
    tags: ["benefícios", "saúde mental", "rh"],
    body: [
      "Transtornos mentais passaram a liderar as causas de afastamento prolongado, deslocando as lesões musculoesqueléticas do topo da estatística.",
      "A resposta das empresas migrou do programa genérico de bem-estar para cobertura efetiva de psicoterapia dentro do plano.",
    ],
  },
  {
    slug: "susep-consulta-publica-distribuicao",
    title: "SUSEP abre consulta pública sobre regras de distribuição digital",
    standfirst:
      "Proposta trata de dever de informação na venda por aplicativo e responsabilidade do intermediário.",
    category: "regulacao",
    authorSlug: "helena-braga",
    publishedAt: "2026-09-15T09:30:00-03:00",
    readingMinutes: 6,
    image: photo("consulta-publica", 600, 400),
    imageAlt: "Sala de audiência pública vazia",
    tags: ["susep", "consulta pública", "distribuição"],
    body: [
      "A minuta em consulta trata de um ponto sensível: de quem é a responsabilidade quando a venda digital acontece dentro do aplicativo de um parceiro não segurador.",
      "Plataformas defendem papel de mera vitrine. O regulador sinaliza entendimento mais amplo de intermediação.",
    ],
  },
  {
    slug: "insurtechs-captacao-2026",
    title: "Insurtechs brasileiras captam menos, mas com tese mais estreita",
    standfirst:
      "Volume de investimento cai enquanto rodadas se concentram em infraestrutura e subscrição.",
    category: "tecnologia",
    authorSlug: "rodrigo-teixeira",
    publishedAt: "2026-09-14T16:40:00-03:00",
    readingMinutes: 5,
    image: photo("insurtechs", 600, 400),
    imageAlt: "Equipe reunida em mesa de trabalho",
    tags: ["insurtech", "investimento", "venture"],
    body: [
      "O capital ficou mais seletivo. Saíram de cena as teses de distribuição pura; entraram as de infraestrutura — motor de precificação, esteira de sinistro, integração regulatória.",
      "A leitura dos investidores é que distribuição sem produto proprietário tem margem estrutural baixa demais.",
    ],
  },
  {
    slug: "fraude-documental-sinistros",
    title: "Fraude documental em sinistros cresce com uso de imagem sintética",
    standfirst:
      "Seguradoras relatam aumento de laudos e fotos manipuladas por ferramentas generativas.",
    category: "tecnologia",
    authorSlug: "tatiana-alencar",
    publishedAt: "2026-09-14T08:15:00-03:00",
    readingMinutes: 6,
    image: photo("fraude-documental", 600, 400),
    imageAlt: "Lupa sobre documentos impressos",
    minTier: "pro",
    tags: ["fraude", "sinistros", "verificação"],
    body: [
      "A mesma tecnologia que acelera a triagem passou a ser usada do outro lado. Fotos de dano geradas ou alteradas por ferramenta generativa chegam com aparência convincente.",
      "A defesa em construção combina verificação de metadados, checagem de proveniência e comparação com histórico de imagens da mesma oficina.",
    ],
  },
  {
    slug: "microsseguro-fintechs-embarcado",
    title: "Crescimento de seguros embarcados em fintechs acelera",
    standfirst:
      "Parcerias entre seguradoras e fintechs para oferta de microsseguros integrados crescem 150% no ano.",
    category: "mercado",
    authorSlug: "marcos-vilela",
    publishedAt: "2026-09-13T12:00:00-03:00",
    readingMinutes: 5,
    image: photo("seguro-embarcado", 600, 400),
    imageAlt: "Celular exibindo aplicativo financeiro",
    tags: ["embedded", "fintech", "microsseguro"],
    body: [
      "Seguro embarcado cresce onde há contexto de compra: crédito, maquininha, marketplace. O prêmio é baixo e a conversão, alta.",
      "O desafio aparece na renovação e no sinistro, momentos em que o cliente descobre que tem um seguro que mal lembra ter contratado.",
    ],
  },
];

const BY_SLUG = new Map(ARTICLES.map((a) => [a.slug, a]));

export function findArticle(slug: string): Article | undefined {
  return BY_SLUG.get(slug);
}
