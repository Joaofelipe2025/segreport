import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryKey, getCategoryMeta } from "@/lib/categories";
import PremiumWidget from "@/components/sidebar/PremiumWidget";
import CopyLinkButton from "./CopyLinkButton";

interface Article {
  slug: string;
  category: CategoryKey;
  title: string;
  deck: string;
  author: string;
  dateTime: string;
  dateLabel: string;
  readTime: string;
  body: string[];
}

const ARTICLES: Article[] = [
  {
    slug: "cnsp-aprova-regras-governanca-seguradoras",
    category: "regulacao",
    title: "CNSP aprova novas regras de governança para seguradoras de médio porte",
    deck: "Resolução define prazos de adequação e novos requisitos de controles internos a partir de 2027.",
    author: "Marina Castelo",
    dateTime: "2026-06-16T07:30:00-03:00",
    dateLabel: "16 de junho de 2026",
    readTime: "4 min",
    body: [
      "O Conselho Nacional de Seguros Privados (CNSP) aprovou nesta semana uma resolução que amplia as exigências de governança corporativa para seguradoras classificadas como de médio porte. A medida, que entra em vigor em janeiro de 2027, estabelece novos requisitos para comitês de auditoria, gestão de riscos e compliance.",
      "Segundo a SUSEP, a mudança busca equiparar o nível de exigência das seguradoras médias ao já praticado pelos grandes grupos do setor, como Porto Seguro, Bradesco Seguros e SulAmérica. A expectativa é que a adequação reduza o risco sistêmico do mercado segurador brasileiro.",
      "Executivos do setor avaliam que o prazo de adequação de 18 meses é apertado, mas factível. Associações de classe já sinalizaram que vão pedir esclarecimentos adicionais sobre os critérios de classificação de porte utilizados pelo regulador.",
      "Especialistas apontam que a resolução também impacta indiretamente os planos de expansão de seguradoras menores que vinham crescendo rapidamente em linhas como auto e vida, podendo elevar custos operacionais no curto prazo.",
    ],
  },
  {
    slug: "sinistralidade-seguro-auto-sobe-primeiro-trimestre",
    category: "auto",
    title: "Sinistralidade de seguro auto sobe 2,3pp no primeiro trimestre",
    deck: "Alta de furtos e roubos em capitais pressiona margens das seguradoras líderes do segmento.",
    author: "Rafael Andrade",
    dateTime: "2026-06-16T05:30:00-03:00",
    dateLabel: "16 de junho de 2026",
    readTime: "3 min",
    body: [
      "Dados consolidados pela Federação Nacional de Seguros Gerais mostram que a sinistralidade do seguro auto avançou 2,3 pontos percentuais no primeiro trimestre de 2026, impulsionada principalmente pelo aumento de furtos e roubos de veículos em regiões metropolitanas.",
      "Porto Seguro, Tokio Marine e HDI Seguros, três das maiores seguradoras do segmento, reportaram alta nos índices de perda em suas teleconferências de resultados, atribuindo o movimento a fatores macroeconômicos e à sofisticação de quadrilhas especializadas em fraude de sinistro.",
      "Para conter o impacto nas margens, seguradoras vêm intensificando o uso de telemetria e exigindo rastreadores em apólices de maior valor segurado, especialmente em capitais com índices de criminalidade mais elevados.",
      "Analistas de mercado acreditam que o reajuste de prêmios deve ser gradual ao longo do ano, evitando perda de competitividade frente a seguradoras digitais que vêm ganhando participação no segmento de pessoa física.",
    ],
  },
  {
    slug: "irb-brasil-aporte-capital-180-milhoes",
    category: "resseguros",
    title: "IRB Brasil anuncia novo aporte de R$180 milhões em capital",
    deck: "Movimento busca reforçar índice de solvência após resultado do quarto trimestre.",
    author: "Camila Fontes",
    dateTime: "2026-06-16T04:30:00-03:00",
    dateLabel: "16 de junho de 2026",
    readTime: "4 min",
    body: [
      "O IRB Brasil Resseguros anunciou um novo aporte de capital de R$ 180 milhões, movimento que visa reforçar seus índices regulatórios de solvência diante de um cenário de maior sinistralidade em contratos de resseguro agrícola e de propriedade.",
      "A operação foi aprovada em assembleia extraordinária e contou com a adesão majoritária dos acionistas de referência da companhia. Em comunicado, a resseguradora afirmou que o aporte está alinhado ao plano de fortalecimento patrimonial anunciado no início do ano.",
      "Analistas do setor financeiro avaliam a medida como positiva, mas reforçam que o mercado ainda acompanha de perto a evolução da carteira de grandes riscos da companhia, especialmente contratos firmados antes de 2023.",
      "A SUSEP informou que monitora a operação, mas não há, até o momento, qualquer restrição regulatória pendente sobre a resseguradora.",
    ],
  },
  {
    slug: "seguradoras-vida-produtos-autonomos",
    category: "vida",
    title: "Seguradoras de vida ampliam oferta de produtos para autônomos",
    deck: "Novos planos miram trabalhadores de plataforma e microempreendedores individuais.",
    author: "Bruno Salgado",
    dateTime: "2026-06-16T02:30:00-03:00",
    dateLabel: "16 de junho de 2026",
    readTime: "3 min",
    body: [
      "Diante do crescimento da economia de plataforma, seguradoras de vida como Bradesco Seguros, Caixa Seguradora e Zurich lançaram nas últimas semanas produtos voltados especificamente para autônomos e microempreendedores individuais (MEIs).",
      "Os novos planos oferecem coberturas simplificadas, com processo de contratação 100% digital e prêmios mensais a partir de R$ 19,90, mirando um público historicamente pouco penetrado pelo seguro de vida tradicional.",
      "Segundo executivos do setor, a estratégia busca capturar uma base estimada em mais de 16 milhões de microempreendedores ativos no país, muitos dos quais sem qualquer cobertura previdenciária complementar.",
      "A expectativa das seguradoras é que o segmento de autônomos represente até 12% da nova produção de seguros de vida individual até o final de 2027.",
    ],
  },
  {
    slug: "ans-susep-integracao-dados-planos-seguros",
    category: "saude",
    title: "ANS e SUSEP discutem integração de dados entre planos e seguros",
    deck: "Reguladores avaliam compartilhamento de informações para combater fraudes no setor.",
    author: "Letícia Moraes",
    dateTime: "2026-06-16T00:30:00-03:00",
    dateLabel: "15 de junho de 2026",
    readTime: "5 min",
    body: [
      "A Agência Nacional de Saúde Suplementar (ANS) e a Superintendência de Seguros Privados (SUSEP) iniciaram conversas técnicas para avaliar a integração de bases de dados entre planos de saúde e seguros de saúde, com foco no combate a fraudes e duplicidade de coberturas.",
      "A proposta, ainda em estágio preliminar, prevê a criação de um cadastro unificado de beneficiários que permitiria identificar inconsistências em sinistros e reembolsos médicos reportados a diferentes operadoras e seguradoras.",
      "Seguradoras como SulAmérica e Allianz, que atuam fortemente no segmento de saúde, acompanham as discussões com interesse, já que o setor estima perdas anuais bilionárias relacionadas a fraudes em reembolsos.",
      "Representantes do setor pedem cautela quanto ao uso de dados sensíveis de saúde, defendendo que qualquer integração respeite rigorosamente a Lei Geral de Proteção de Dados (LGPD).",
    ],
  },
  {
    slug: "seguro-rural-recorde-contratacoes-semestre",
    category: "agro",
    title: "Seguro rural cresce 22% e bate recorde de contratações no semestre",
    deck: "Produtores do Centro-Oeste impulsionam demanda diante de risco climático crescente.",
    author: "Eduardo Pires",
    dateTime: "2026-06-15T22:30:00-03:00",
    dateLabel: "15 de junho de 2026",
    readTime: "4 min",
    body: [
      "O seguro rural registrou crescimento de 22% em número de contratações no primeiro semestre de 2026, atingindo um novo recorde histórico, segundo dados compilados por seguradoras do setor agro.",
      "Produtores de soja e milho do Centro-Oeste foram os principais responsáveis pelo avanço, em um contexto de maior percepção de risco climático após estiagens severas registradas nas últimas duas safras.",
      "Mapfre e demais seguradoras com forte atuação no segmento agro reforçaram equipes comerciais em Mato Grosso e Goiás para atender à demanda crescente, especialmente entre produtores de médio porte que antes não contratavam cobertura.",
      "O governo federal também ampliou o orçamento do Programa de Subvenção ao Prêmio do Seguro Rural (PSR) para 2026, o que deve sustentar o ritmo de crescimento nos próximos meses.",
    ],
  },
];

interface RelatedItem {
  slug: string;
  category: CategoryKey;
  title: string;
  readTime: string;
}

function getRelatedArticles(current: Article): RelatedItem[] {
  return ARTICLES.filter((article) => article.slug !== current.slug)
    .slice(0, 3)
    .map((article) => ({
      slug: article.slug,
      category: article.category,
      title: article.title,
      readTime: article.readTime,
    }));
}

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((item) => item.slug === slug);

  if (!article) {
    return {
      title: "Notícia não encontrada | Segreport",
    };
  }

  return {
    title: `${article.title} | Segreport`,
    description: article.deck,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES.find((item) => item.slug === slug);

  if (!article) {
    notFound();
  }

  const meta = getCategoryMeta(article.category);
  const related = getRelatedArticles(article);
  const shareUrl = `https://www.segreport.com.br/noticias/${article.slug}`;
  const encodedTitle = encodeURIComponent(article.title);
  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          <header className="max-w-[720px]">
            <span
              className="font-mono text-[11px] font-medium uppercase tracking-wide"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>

            <h1 className="mt-3 font-sans text-[28px] font-extrabold leading-tight text-[#1A1A18] md:text-[42px]">
              {article.title}
            </h1>

            <p className="mt-4 font-sans text-[18px] font-light leading-relaxed text-[#3D3D3A]">
              {article.deck}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[12px] text-[#76766f]">
              <span>{article.author}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={article.dateTime}>{article.dateLabel}</time>
              <span aria-hidden="true">·</span>
              <span>{article.readTime} de leitura</span>
            </div>
          </header>

          <div
            className="mt-8 flex h-[400px] w-full items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(135deg, #062918, ${meta.color})`,
            }}
          >
            <span className="text-[120px]" aria-hidden="true">
              {meta.emoji}
            </span>
          </div>

          <div className="mx-auto mt-8 flex max-w-[720px] items-center gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766f]">
              Compartilhar
            </span>
            <a
              href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartilhar no WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,0,0,.08)] text-[#3D3D3A] transition-colors hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.5 8.5 0 1 1-4.07-7.26L21 3l-1.2 4.06A8.46 8.46 0 0 1 21 11.5Z" />
                <path d="M8 12a4 4 0 0 0 6 2l1.5.5-.5-1.5A4 4 0 0 0 8 12Z" />
              </svg>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartilhar no LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,0,0,.08)] text-[#3D3D3A] transition-colors hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 8a6 6 0 0 1 6 6v6h-4v-6a2 2 0 0 0-4 0v6h-4v-6a6 6 0 0 1 6-6Z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartilhar no Twitter/X"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,0,0,.08)] text-[#3D3D3A] transition-colors hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4l16 16M20 4 4 20" />
              </svg>
            </a>
            <CopyLinkButton url={shareUrl} />
          </div>

          <article className="mx-auto mt-8 flex max-w-[720px] flex-col gap-5">
            {article.body.map((paragraph, index) => (
              <p
                key={index}
                className="font-sans text-[18px] font-normal leading-[1.8] text-[#3D3D3A]"
              >
                {paragraph}
              </p>
            ))}
          </article>
        </div>

        <aside className="hidden flex-col gap-8 lg:flex">
          <section aria-label="Notícias relacionadas">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
                Notícias relacionadas
              </h2>
              <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
            </div>
            <ul className="flex flex-col">
              {related.map((item) => {
                const itemMeta = getCategoryMeta(item.category);
                return (
                  <li
                    key={item.slug}
                    className="border-b border-[rgba(0,0,0,.08)] py-4 first:pt-0 last:border-b-0"
                  >
                    <a
                      href={`/noticias/${item.slug}`}
                      className="group flex flex-col gap-1.5"
                    >
                      <span
                        className="font-mono text-[10px] font-medium uppercase tracking-wide"
                        style={{ color: itemMeta.color }}
                      >
                        {itemMeta.label}
                      </span>
                      <h3 className="font-sans text-[14px] font-semibold leading-snug text-[#1A1A18] transition-colors group-hover:text-[#0D6E4F]">
                        {item.title}
                      </h3>
                      <span className="font-mono text-[11px] text-[#76766f]">{item.readTime}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <PremiumWidget />
        </aside>
      </div>

      <section aria-label="Mais notícias relacionadas" className="mt-14">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766f]">
            Notícias relacionadas
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-[rgba(0,0,0,.08)] md:grid-cols-3">
          {related.map((item) => {
            const itemMeta = getCategoryMeta(item.category);
            return (
              <a
                key={item.slug}
                href={`/noticias/${item.slug}`}
                className="group flex flex-col gap-2 bg-white p-4 transition-colors hover:bg-[#F7F7F5]"
              >
                <span
                  className="font-mono text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: itemMeta.color }}
                >
                  {itemMeta.label}
                </span>
                <h3 className="font-sans text-[15px] font-bold leading-snug text-[#1A1A18] transition-colors group-hover:text-[#0D6E4F]">
                  {item.title}
                </h3>
                <span className="font-mono text-[11px] text-[#76766f]">{item.readTime}</span>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
