"use client";

import { useState } from "react";

type CircularTipo = "Circular SUSEP" | "Resolução CNSP" | "Carta Circular";
type Ano = 2024 | 2025 | 2026;

interface CircularItem {
  numero: string;
  tipo: CircularTipo;
  titulo: string;
  dateTime: string;
  data: string;
  ano: Ano;
  resumo: string;
}

const TIPOS: CircularTipo[] = ["Circular SUSEP", "Resolução CNSP", "Carta Circular"];
const ANOS: Ano[] = [2024, 2025, 2026];

const CIRCULARES: CircularItem[] = [
  {
    numero: "SUSEP 689/2026",
    tipo: "Circular SUSEP",
    titulo: "Atualização do plano de contas para sociedades seguradoras",
    dateTime: "2026-06-14",
    data: "14 jun 2026",
    ano: 2026,
    resumo:
      "Revisa contas contábeis e prazos de envio do plano de contas padronizado pela SUSEP.",
  },
  {
    numero: "CNSP 478/2026",
    tipo: "Resolução CNSP",
    titulo: "Novas regras de governança para seguradoras de médio porte",
    dateTime: "2026-06-15",
    data: "15 jun 2026",
    ano: 2026,
    resumo:
      "Estabelece requisitos mínimos de comitês de auditoria e compliance para seguradoras de porte médio.",
  },
  {
    numero: "CC 142/2026",
    tipo: "Carta Circular",
    titulo: "Orientações sobre envio do FIP eletrônico trimestral",
    dateTime: "2026-06-12",
    data: "12 jun 2026",
    ano: 2026,
    resumo: "Detalha o leiaute e prazos de transmissão do Formulário de Informações Periódicas.",
  },
  {
    numero: "CNSP 477/2026",
    tipo: "Resolução CNSP",
    titulo: "Revisão do capital mínimo requerido para resseguradoras locais",
    dateTime: "2026-06-10",
    data: "10 jun 2026",
    ano: 2026,
    resumo: "Atualiza os parâmetros de capital baseado em risco para resseguradoras locais.",
  },
  {
    numero: "SUSEP 687/2026",
    tipo: "Circular SUSEP",
    titulo: "Critérios de provisionamento técnico para seguro rural",
    dateTime: "2026-06-08",
    data: "08 jun 2026",
    ano: 2026,
    resumo: "Define novas regras de constituição de provisões técnicas para o ramo agro.",
  },
  {
    numero: "CC 141/2026",
    tipo: "Carta Circular",
    titulo: "Cronograma de migração do sistema SUSEP Digital",
    dateTime: "2026-06-05",
    data: "05 jun 2026",
    ano: 2026,
    resumo: "Estabelece datas-limite para migração das seguradoras à nova plataforma digital.",
  },
  {
    numero: "SUSEP 685/2026",
    tipo: "Circular SUSEP",
    titulo: "Regras de divulgação de sinistralidade por ramo",
    dateTime: "2026-06-02",
    data: "02 jun 2026",
    ano: 2026,
    resumo: "Padroniza a divulgação trimestral de índices de sinistralidade por ramo de atuação.",
  },
  {
    numero: "CNSP 476/2026",
    tipo: "Resolução CNSP",
    titulo: "Consulta pública sobre marco de capital baseado em risco",
    dateTime: "2026-05-29",
    data: "29 mai 2026",
    ano: 2026,
    resumo: "Abre consulta pública para revisão do modelo de capital baseado em risco (CBR).",
  },
  {
    numero: "SUSEP 671/2025",
    tipo: "Circular SUSEP",
    titulo: "Regras de portabilidade para planos de previdência aberta",
    dateTime: "2025-11-20",
    data: "20 nov 2025",
    ano: 2025,
    resumo: "Simplifica o processo de portabilidade entre planos de previdência complementar aberta.",
  },
  {
    numero: "CNSP 462/2025",
    tipo: "Resolução CNSP",
    titulo: "Atualização das tábuas biométricas para seguros de vida",
    dateTime: "2025-09-15",
    data: "15 set 2025",
    ano: 2025,
    resumo: "Adota novas tábuas biométricas para cálculo de reservas em seguros de vida e previdência.",
  },
  {
    numero: "CC 128/2025",
    tipo: "Carta Circular",
    titulo: "Esclarecimentos sobre o uso de IA em subscrição de risco",
    dateTime: "2025-07-03",
    data: "03 jul 2025",
    ano: 2025,
    resumo: "Orienta seguradoras sobre transparência e auditabilidade de modelos de IA na subscrição.",
  },
  {
    numero: "SUSEP 648/2025",
    tipo: "Circular SUSEP",
    titulo: "Novo formulário de comunicação de incidentes cibernéticos",
    dateTime: "2025-04-22",
    data: "22 abr 2025",
    ano: 2025,
    resumo: "Cria canal obrigatório de notificação de incidentes de segurança da informação à SUSEP.",
  },
  {
    numero: "CNSP 441/2024",
    tipo: "Resolução CNSP",
    titulo: "Regras de comercialização de seguros por canais digitais",
    dateTime: "2024-10-08",
    data: "08 out 2024",
    ano: 2024,
    resumo: "Disciplina a oferta e venda de seguros por aplicativos, marketplaces e insurtechs.",
  },
  {
    numero: "SUSEP 612/2024",
    tipo: "Circular SUSEP",
    titulo: "Atualização dos limites de retenção para seguro de transportes",
    dateTime: "2024-06-19",
    data: "19 jun 2024",
    ano: 2024,
    resumo: "Revisa os limites técnicos de retenção de risco no ramo de transportes nacionais.",
  },
  {
    numero: "CC 109/2024",
    tipo: "Carta Circular",
    titulo: "Procedimentos para registro de produtos de microsseguro",
    dateTime: "2024-03-11",
    data: "11 mar 2024",
    ano: 2024,
    resumo: "Simplifica o rito de registro de produtos voltados à população de baixa renda.",
  },
];

function tipoColor(tipo: CircularTipo): string {
  if (tipo === "Resolução CNSP") return "#0D6E4F";
  if (tipo === "Circular SUSEP") return "#2B6CB0";
  return "#B87214";
}

export default function CircularesFilterList() {
  const [anoFiltro, setAnoFiltro] = useState<Ano | "Todos">("Todos");
  const [tipoFiltro, setTipoFiltro] = useState<CircularTipo | "Todos">("Todos");

  const itensFiltrados = CIRCULARES.filter(
    (item) =>
      (anoFiltro === "Todos" || item.ano === anoFiltro) &&
      (tipoFiltro === "Todos" || item.tipo === tipoFiltro)
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3">
        <div role="group" aria-label="Filtrar por ano" className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
            Ano:
          </span>
          <button
            type="button"
            aria-pressed={anoFiltro === "Todos"}
            onClick={() => setAnoFiltro("Todos")}
            className={`rounded-full border px-4 py-1.5 font-mono text-[12px] font-medium transition-colors ${
              anoFiltro === "Todos"
                ? "border-[#0D6E4F] bg-[#0D6E4F] text-white"
                : "border-[rgba(0,0,0,.08)] text-[#76766F] hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
            }`}
          >
            Todos
          </button>
          {ANOS.map((ano) => (
            <button
              key={ano}
              type="button"
              aria-pressed={anoFiltro === ano}
              onClick={() => setAnoFiltro(ano)}
              className={`rounded-full border px-4 py-1.5 font-mono text-[12px] font-medium transition-colors ${
                anoFiltro === ano
                  ? "border-[#0D6E4F] bg-[#0D6E4F] text-white"
                  : "border-[rgba(0,0,0,.08)] text-[#76766F] hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
              }`}
            >
              {ano}
            </button>
          ))}
        </div>

        <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
            Tipo:
          </span>
          <button
            type="button"
            aria-pressed={tipoFiltro === "Todos"}
            onClick={() => setTipoFiltro("Todos")}
            className={`rounded-full border px-4 py-1.5 font-mono text-[12px] font-medium transition-colors ${
              tipoFiltro === "Todos"
                ? "border-[#0D6E4F] bg-[#0D6E4F] text-white"
                : "border-[rgba(0,0,0,.08)] text-[#76766F] hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
            }`}
          >
            Todos
          </button>
          {TIPOS.map((tipo) => (
            <button
              key={tipo}
              type="button"
              aria-pressed={tipoFiltro === tipo}
              onClick={() => setTipoFiltro(tipo)}
              className={`rounded-full border px-4 py-1.5 font-mono text-[12px] font-medium transition-colors ${
                tipoFiltro === tipo
                  ? "border-[#0D6E4F] bg-[#0D6E4F] text-white"
                  : "border-[rgba(0,0,0,.08)] text-[#76766F] hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-[rgba(0,0,0,.08)] md:grid-cols-2">
        {itensFiltrados.map((item) => (
          <li key={item.numero} className="flex flex-col gap-3 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-mono text-[10px] font-medium uppercase tracking-wide"
                style={{ color: tipoColor(item.tipo) }}
              >
                {item.tipo}
              </span>
              <span className="font-mono text-[11px] text-[#A8A8A3]">{item.numero}</span>
            </div>
            <h3 className="font-sans text-[15px] font-bold leading-snug text-[#1A1A18]">
              {item.titulo}
            </h3>
            <time dateTime={item.dateTime} className="font-mono text-[11px] text-[#76766F]">
              {item.data}
            </time>
            <p className="font-sans text-[14px] leading-relaxed text-[#3D3D3A]">{item.resumo}</p>
            <a
              href="#"
              className="mt-1 font-sans text-[13px] font-semibold text-[#0D6E4F] transition-colors hover:text-[#12956A]"
            >
              Ler na íntegra →
            </a>
          </li>
        ))}
        {itensFiltrados.length === 0 && (
          <li className="bg-white p-6 text-center font-sans text-sm text-[#76766F]">
            Nenhuma norma encontrada para os filtros selecionados.
          </li>
        )}
      </ul>
    </div>
  );
}
