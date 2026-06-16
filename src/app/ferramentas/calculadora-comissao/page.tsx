"use client";

import { useMemo, useState } from "react";

type Ramo = "auto" | "vida" | "saude" | "residencial" | "empresarial" | "agro";

interface RamoOption {
  key: Ramo;
  label: string;
  comissaoPadrao: number;
}

const RAMOS: RamoOption[] = [
  { key: "auto", label: "Auto", comissaoPadrao: 15 },
  { key: "vida", label: "Vida", comissaoPadrao: 30 },
  { key: "saude", label: "Saúde", comissaoPadrao: 5 },
  { key: "residencial", label: "Residencial", comissaoPadrao: 20 },
  { key: "empresarial", label: "Empresarial", comissaoPadrao: 12 },
  { key: "agro", label: "Agro", comissaoPadrao: 10 },
];

interface FaixaIR {
  ate: number;
  aliquota: number;
  deducao: number;
}

const FAIXAS_IR: FaixaIR[] = [
  { ate: 2259.2, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.0 },
];

function calcularIR(baseMensal: number): number {
  if (baseMensal <= 0) return 0;

  const faixa = FAIXAS_IR.find((f) => baseMensal <= f.ate) ?? FAIXAS_IR[FAIXAS_IR.length - 1];

  if (faixa.aliquota === 0) return 0;

  const ir = baseMensal * faixa.aliquota - faixa.deducao;
  return ir > 0 ? ir : 0;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Tom = "atencao" | "positivo" | "destaque";

interface AlertaResultado {
  tom: Tom;
  mensagem: string;
}

function gerarAlerta(liquidoTotalMensal: number): AlertaResultado {
  if (liquidoTotalMensal < 2000) {
    return {
      tom: "atencao",
      mensagem:
        "Receita líquida mensal ainda baixa. Considere aumentar o número de apólices fechadas por mês ou negociar uma comissão melhor com a seguradora.",
    };
  }
  if (liquidoTotalMensal > 10000) {
    return {
      tom: "destaque",
      mensagem:
        "Receita líquida mensal elevada. Pode ser o momento de avaliar a abertura de um CNPJ (PJ) para otimizar a carga tributária.",
    };
  }
  return {
    tom: "positivo",
    mensagem:
      "Receita líquida mensal saudável. Continue acompanhando sua carteira e busque aumentar a taxa de renovação para crescer ainda mais.",
  };
}

const ALERTA_STYLES: Record<Tom, { bg: string; border: string; text: string }> = {
  atencao: { bg: "#FFF7ED", border: "#B87214", text: "#B87214" },
  positivo: { bg: "#EAF8F1", border: "#12956A", text: "#12956A" },
  destaque: { bg: "#E6F2ED", border: "#0D6E4F", text: "#0D6E4F" },
};

export default function CalculadoraComissaoPage() {
  const [ramo, setRamo] = useState<Ramo>("auto");
  const [premioMedio, setPremioMedio] = useState<number>(250);
  const [comissaoPercentual, setComissaoPercentual] = useState<number>(
    RAMOS.find((r) => r.key === "auto")?.comissaoPadrao ?? 15
  );
  const [apolicesPorMes, setApolicesPorMes] = useState<number>(20);
  const [taxaRenovacao, setTaxaRenovacao] = useState<number>(60);

  function handleSelecionarRamo(novoRamo: Ramo) {
    setRamo(novoRamo);
    const opcao = RAMOS.find((r) => r.key === novoRamo);
    if (opcao) {
      setComissaoPercentual(opcao.comissaoPadrao);
    }
  }

  const resultados = useMemo(() => {
    const comissaoBrutaMensal = premioMedio * (comissaoPercentual / 100) * apolicesPorMes;
    const irEstimado = calcularIR(comissaoBrutaMensal);
    const receitaRenovacaoMensal = comissaoBrutaMensal * (taxaRenovacao / 100);
    const liquidoTotalMensal = comissaoBrutaMensal - irEstimado + receitaRenovacaoMensal;
    const receitaAnual = liquidoTotalMensal * 12;

    return {
      comissaoBrutaMensal,
      irEstimado,
      receitaRenovacaoMensal,
      liquidoTotalMensal,
      receitaAnual,
    };
  }, [premioMedio, comissaoPercentual, apolicesPorMes, taxaRenovacao]);

  const alerta = gerarAlerta(resultados.liquidoTotalMensal);
  const alertaStyle = ALERTA_STYLES[alerta.tom];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section aria-label="Introdução à calculadora" className="mb-10">
        <h1 className="font-sans text-[32px] font-extrabold leading-[44px] text-[#1A1A18]">
          Calculadora de comissão
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-[15px] text-[#3D3D3A]">
          Simule sua comissão bruta, o imposto de renda estimado e a receita
          líquida mensal e anual de acordo com o ramo, prêmio médio e volume
          de apólices.
        </p>
      </section>

      <section aria-label="Parâmetros da simulação" className="mb-10">
        <div className="rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5 md:p-7">
          <div className="mb-6">
            <span className="mb-3 block font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
              Ramo
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Selecione o ramo">
              {RAMOS.map((opcao) => {
                const selecionado = opcao.key === ramo;
                return (
                  <button
                    key={opcao.key}
                    type="button"
                    aria-pressed={selecionado}
                    onClick={() => handleSelecionarRamo(opcao.key)}
                    className={
                      selecionado
                        ? "rounded-lg bg-[#0D6E4F] px-4 py-2 font-sans text-[14px] font-semibold text-white"
                        : "rounded-lg border border-[rgba(0,0,0,.08)] bg-white px-4 py-2 font-sans text-[14px] font-semibold text-[#3D3D3A] transition-colors hover:border-[#0D6E4F]"
                    }
                  >
                    {opcao.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="premio-medio"
              className="mb-2 block font-sans text-[14px] font-semibold text-[#1A1A18]"
            >
              Prêmio médio mensal (R$)
            </label>
            <input
              id="premio-medio"
              type="number"
              min={0}
              step={10}
              value={premioMedio}
              onChange={(e) => setPremioMedio(Number(e.target.value))}
              className="w-full max-w-xs rounded-lg border border-[rgba(0,0,0,.08)] bg-white px-3 py-2 font-mono text-[14px] text-[#1A1A18] outline-none focus:border-[#0D6E4F]"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="comissao-percentual"
              className="mb-2 flex items-center justify-between font-sans text-[14px] font-semibold text-[#1A1A18]"
            >
              <span>Comissão (%)</span>
              <span className="font-mono text-[14px] font-bold text-[#0D6E4F]">
                {comissaoPercentual}%
              </span>
            </label>
            <input
              id="comissao-percentual"
              type="range"
              min={0}
              max={40}
              step={1}
              value={comissaoPercentual}
              onChange={(e) => setComissaoPercentual(Number(e.target.value))}
              aria-label="Comissão em percentual"
              className="w-full accent-[#0D6E4F]"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="apolices-mes"
              className="mb-2 flex items-center justify-between font-sans text-[14px] font-semibold text-[#1A1A18]"
            >
              <span>Apólices fechadas por mês</span>
              <span className="font-mono text-[14px] font-bold text-[#0D6E4F]">
                {apolicesPorMes}
              </span>
            </label>
            <input
              id="apolices-mes"
              type="range"
              min={1}
              max={200}
              step={1}
              value={apolicesPorMes}
              onChange={(e) => setApolicesPorMes(Number(e.target.value))}
              aria-label="Apólices fechadas por mês"
              className="w-full accent-[#0D6E4F]"
            />
          </div>

          <div>
            <label
              htmlFor="taxa-renovacao"
              className="mb-2 flex items-center justify-between font-sans text-[14px] font-semibold text-[#1A1A18]"
            >
              <span>Taxa de renovação (%)</span>
              <span className="font-mono text-[14px] font-bold text-[#0D6E4F]">
                {taxaRenovacao}%
              </span>
            </label>
            <input
              id="taxa-renovacao"
              type="range"
              min={0}
              max={100}
              step={1}
              value={taxaRenovacao}
              onChange={(e) => setTaxaRenovacao(Number(e.target.value))}
              aria-label="Taxa de renovação em percentual"
              className="w-full accent-[#0D6E4F]"
            />
          </div>
        </div>
      </section>

      <section aria-label="Resultados da simulação" className="mb-10">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#76766F]">
            Resultados
          </h2>
          <span className="h-px flex-1 bg-[rgba(0,0,0,.08)]" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5">
            <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
              Comissão bruta mensal
            </span>
            <span className="font-mono text-[24px] font-bold text-[#1A1A18]">
              {formatBRL(resultados.comissaoBrutaMensal)}
            </span>
          </div>

          <div className="rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5">
            <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
              IR estimado
            </span>
            <span className="font-mono text-[24px] font-bold text-[#B83232]">
              {formatBRL(resultados.irEstimado)}
            </span>
          </div>

          <div className="rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5">
            <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
              Receita de renovação mensal
            </span>
            <span className="font-mono text-[24px] font-bold text-[#1A1A18]">
              {formatBRL(resultados.receitaRenovacaoMensal)}
            </span>
          </div>

          <div className="rounded-xl border border-[#E6F2ED] bg-[#E6F2ED] p-5">
            <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-wide text-[#0D6E4F]">
              Líquido total mensal
            </span>
            <span className="font-mono text-[28px] font-bold text-[#0D6E4F]">
              {formatBRL(resultados.liquidoTotalMensal)}
            </span>
          </div>

          <div className="rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5 lg:col-span-2">
            <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
              Receita anual
            </span>
            <span className="font-mono text-[28px] font-bold text-[#1A1A18]">
              {formatBRL(resultados.receitaAnual)}
            </span>
          </div>
        </div>
      </section>

      <section aria-label="Recomendação personalizada">
        <div
          role="status"
          className="rounded-xl border p-5"
          style={{
            backgroundColor: alertaStyle.bg,
            borderColor: alertaStyle.border,
          }}
        >
          <p className="font-sans text-[14px] font-medium" style={{ color: alertaStyle.text }}>
            {alerta.mensagem}
          </p>
        </div>
      </section>
    </main>
  );
}
