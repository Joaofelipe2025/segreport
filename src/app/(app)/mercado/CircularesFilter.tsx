"use client";

import { useState } from "react";

type CircularTipo = "Resolução CNSP" | "Circular SUSEP" | "Carta Circular";

interface Circular {
  numero: string;
  tipo: CircularTipo;
  titulo: string;
  data: string;
  dateTime: string;
}

const TIPOS: CircularTipo[] = ["Resolução CNSP", "Circular SUSEP", "Carta Circular"];

const CIRCULARES: Circular[] = [
  {
    numero: "CNSP 478/2026",
    tipo: "Resolução CNSP",
    titulo: "Novas regras de governança para seguradoras de médio porte",
    data: "15 jun 2026",
    dateTime: "2026-06-15",
  },
  {
    numero: "SUSEP 689/2026",
    tipo: "Circular SUSEP",
    titulo: "Atualização do plano de contas para sociedades seguradoras",
    data: "14 jun 2026",
    dateTime: "2026-06-14",
  },
  {
    numero: "CC 142/2026",
    tipo: "Carta Circular",
    titulo: "Orientações sobre envio do FIP eletrônico trimestral",
    data: "12 jun 2026",
    dateTime: "2026-06-12",
  },
  {
    numero: "CNSP 477/2026",
    tipo: "Resolução CNSP",
    titulo: "Revisão do capital mínimo requerido para resseguradoras locais",
    data: "10 jun 2026",
    dateTime: "2026-06-10",
  },
  {
    numero: "SUSEP 687/2026",
    tipo: "Circular SUSEP",
    titulo: "Critérios de provisionamento técnico para seguro rural",
    data: "08 jun 2026",
    dateTime: "2026-06-08",
  },
  {
    numero: "CC 141/2026",
    tipo: "Carta Circular",
    titulo: "Cronograma de migração do sistema SUSEP Digital",
    data: "05 jun 2026",
    dateTime: "2026-06-05",
  },
  {
    numero: "SUSEP 685/2026",
    tipo: "Circular SUSEP",
    titulo: "Regras de divulgação de sinistralidade por ramo",
    data: "02 jun 2026",
    dateTime: "2026-06-02",
  },
  {
    numero: "CNSP 476/2026",
    tipo: "Resolução CNSP",
    titulo: "Consulta pública sobre marco de capital baseado em risco",
    data: "29 mai 2026",
    dateTime: "2026-05-29",
  },
];

function tipoColor(tipo: CircularTipo): string {
  if (tipo === "Resolução CNSP") return "#0D6E4F";
  if (tipo === "Circular SUSEP") return "#2B6CB0";
  return "#B87214";
}

export default function CircularesFilter() {
  const [filtro, setFiltro] = useState<CircularTipo | "Todos">("Todos");

  const itensFiltrados = CIRCULARES.filter(
    (item) => filtro === "Todos" || item.tipo === filtro
  );

  return (
    <div>
      <div role="group" aria-label="Filtrar circulares por tipo" className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={filtro === "Todos"}
          onClick={() => setFiltro("Todos")}
          className={`rounded-full border px-4 py-1.5 font-mono text-[12px] font-medium transition-colors ${
            filtro === "Todos"
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
            aria-pressed={filtro === tipo}
            onClick={() => setFiltro(tipo)}
            className={`rounded-full border px-4 py-1.5 font-mono text-[12px] font-medium transition-colors ${
              filtro === tipo
                ? "border-[#0D6E4F] bg-[#0D6E4F] text-white"
                : "border-[rgba(0,0,0,.08)] text-[#76766F] hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-[rgba(0,0,0,.08)] md:grid-cols-2">
        {itensFiltrados.map((item) => (
          <li key={item.numero} className="flex flex-col gap-2 bg-white p-4">
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
          </li>
        ))}
        {itensFiltrados.length === 0 && (
          <li className="bg-white p-6 text-center font-sans text-sm text-[#76766F]">
            Nenhuma circular encontrada para este filtro.
          </li>
        )}
      </ul>
    </div>
  );
}
