import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dados SUSEP | Segreport",
  description:
    "Indicadores e dados públicos do mercado segurador brasileiro consolidados a partir de fontes oficiais da SUSEP.",
};

interface DataSource {
  name: string;
  description: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    name: "Portal de Dados Abertos da SUSEP",
    description:
      "Conjuntos de dados públicos sobre seguros, previdência complementar aberta, capitalização e resseguros, disponibilizados em formato aberto pela autarquia.",
  },
  {
    name: "Boletim Estatístico SUSEP",
    description:
      "Publicação periódica com séries históricas de prêmios, sinistros e resultados consolidados por ramo e por sociedade supervisionada.",
  },
  {
    name: "Sistema de Estatísticas da SUSEP (SES)",
    description:
      "Base estatística oficial com dados detalhados de prêmios emitidos, sinistros ocorridos e indicadores de sinistralidade do mercado.",
  },
];

interface ExternalLink {
  label: string;
  href: string;
}

const EXTERNAL_LINKS: ExternalLink[] = [
  {
    label: "Portal institucional da SUSEP",
    href: "https://www.gov.br/susep/pt-br",
  },
  {
    label: "Dados Abertos da SUSEP",
    href: "https://www.gov.br/susep/pt-br/acesso-a-informacao/dados-abertos",
  },
  {
    label: "Estatísticas e SES",
    href: "https://www.gov.br/susep/pt-br/setor-regulado/estatisticas",
  },
];

interface PremiumByLine {
  ramo: string;
  premio: string;
  variacao: string;
}

const PREMIUM_BY_LINE: PremiumByLine[] = [
  { ramo: "Auto", premio: "98,4", variacao: "+5,2%" },
  { ramo: "Vida", premio: "112,7", variacao: "+8,1%" },
  { ramo: "Saúde", premio: "215,3", variacao: "+6,4%" },
  { ramo: "Patrimonial", premio: "47,9", variacao: "+3,9%" },
  { ramo: "Agro", premio: "31,2", variacao: "+11,6%" },
  { ramo: "Resseguros", premio: "22,8", variacao: "+4,3%" },
  { ramo: "Transportes", premio: "9,6", variacao: "+2,1%" },
];

interface LossRatioByYear {
  ano: string;
  sinistralidade: string;
  observacao: string;
}

const LOSS_RATIO_HISTORY: LossRatioByYear[] = [
  { ano: "2021", sinistralidade: "58,3%", observacao: "Recuperação pós-pandemia" },
  { ano: "2022", sinistralidade: "61,7%", observacao: "Alta de custos de reparo" },
  { ano: "2023", sinistralidade: "63,5%", observacao: "Pressão inflacionária no setor" },
  { ano: "2024", sinistralidade: "62,1%", observacao: "Estabilização parcial" },
  { ano: "2025", sinistralidade: "64,2%", observacao: "Eventos climáticos extremos" },
];

export default function DadosSusepPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section aria-label="Introdução aos dados SUSEP" className="mb-10">
        <h1 className="font-sans text-[32px] font-extrabold leading-[44px] text-[#1A1A18]">
          Dados SUSEP
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-[15px] text-[#3D3D3A]">
          Os indicadores apresentados nesta página são consolidados a partir de
          fontes públicas oficiais da Superintendência de Seguros Privados
          (SUSEP), reunindo prêmios, sinistros e estatísticas do mercado
          segurador brasileiro.
        </p>
      </section>

      <section aria-label="Fontes de dados" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766F]">
            Fontes de dados
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <p className="mb-5 max-w-2xl font-sans text-[14px] text-[#3D3D3A]">
          Todos os números desta página têm origem em bases e publicações
          oficiais mantidas pela SUSEP. Abaixo estão as principais fontes
          utilizadas na consolidação dos dados.
        </p>
        <ul className="flex flex-col gap-4">
          {DATA_SOURCES.map((source) => (
            <li
              key={source.name}
              className="rounded-lg border border-[rgba(0,0,0,.08)] bg-white p-5"
            >
              <h3 className="font-sans text-[15px] font-semibold text-[#1A1A18]">
                {source.name}
              </h3>
              <p className="mt-1.5 font-sans text-[13px] leading-snug text-[#3D3D3A]">
                {source.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Links diretos para o portal SUSEP" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766F]">
            Links diretos para o portal SUSEP
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <ul className="flex flex-col gap-3">
          {EXTERNAL_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.label} (abre em nova aba)`}
                className="inline-flex items-center gap-1.5 font-sans text-[14px] font-medium text-[#0D6E4F] underline-offset-2 hover:underline"
              >
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Prêmios por ramo" className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766F]">
            Prêmios por ramo
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-[rgba(0,0,0,.08)] bg-white">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,.08)] bg-[#F7F7F5]">
                <th scope="col" className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
                  Ramo
                </th>
                <th scope="col" className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
                  Prêmio emitido (R$ bi)
                </th>
                <th scope="col" className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
                  Variação
                </th>
              </tr>
            </thead>
            <tbody>
              {PREMIUM_BY_LINE.map((row) => (
                <tr key={row.ramo} className="border-b border-[rgba(0,0,0,.06)] last:border-b-0">
                  <td className="px-4 py-3 font-sans text-[14px] text-[#3D3D3A]">
                    {row.ramo}
                  </td>
                  <td className="px-4 py-3 font-mono text-[14px] font-semibold text-[#1A1A18]">
                    {row.premio}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] font-medium text-[#12956A]">
                    {row.variacao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Sinistralidade histórica" className="mb-10">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766F]">
            Sinistralidade histórica
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-[rgba(0,0,0,.08)] bg-white">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,.08)] bg-[#F7F7F5]">
                <th scope="col" className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
                  Ano
                </th>
                <th scope="col" className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
                  Sinistralidade (%)
                </th>
                <th scope="col" className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
                  Observação
                </th>
              </tr>
            </thead>
            <tbody>
              {LOSS_RATIO_HISTORY.map((row) => (
                <tr key={row.ano} className="border-b border-[rgba(0,0,0,.06)] last:border-b-0">
                  <td className="px-4 py-3 font-mono text-[14px] font-semibold text-[#1A1A18]">
                    {row.ano}
                  </td>
                  <td className="px-4 py-3 font-mono text-[14px] text-[#3D3D3A]">
                    {row.sinistralidade}
                  </td>
                  <td className="px-4 py-3 font-sans text-[13px] text-[#3D3D3A]">
                    {row.observacao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="font-mono text-[12px] text-[#76766F]">
        Última atualização: 16 jun 2026
      </p>
    </main>
  );
}
