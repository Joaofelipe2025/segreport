"use client";

import { useState, type FormEvent } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ExamplePrompt {
  label: string;
}

interface AiToolCard {
  name: string;
  description: string;
  href: string;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  { label: "Qual a sinistralidade média do seguro auto em 2026?" },
  { label: "O que mudou na última circular da SUSEP?" },
  { label: "Como calcular minha comissão como corretor?" },
];

const MOCK_RESPONSES: string[] = [
  "Com base nos dados mais recentes da SUSEP, a sinistralidade média do ramo consultado tem se mantido estável, com leve tendência de queda nos últimos trimestres. Para uma análise detalhada por região e perfil de segurado, recomendo consultar o Dashboard de Mercado.",
  "As circulares regulatórias recentes trazem ajustes em requisitos de governança e solvência para seguradoras. Os principais pontos de atenção são prazos de adequação e novas exigências de transparência ao consumidor. Acompanhe a seção de Regulação para o texto completo.",
  "O cálculo de comissão considera o percentual negociado com a seguradora sobre o prêmio líquido, descontando impostos e, no caso de PJ, encargos tributários. Use a Calculadora de Comissão em Ferramentas para simular seu caso com precisão.",
];

const FALLBACK_RESPONSE =
  "Essa é uma ótima pergunta sobre o mercado segurador brasileiro. No momento estou em modo de demonstração, mas no plano Premium eu posso analisar dados da SUSEP, circulares regulatórias e notícias do setor em tempo real para te dar uma resposta completa e atualizada.";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Olá! Sou o assistente de IA da Segreport, especializado no mercado segurador brasileiro. Posso ajudar com dúvidas sobre produtos, regulação da SUSEP, sinistralidade, comissionamento e tendências do setor. Como posso ajudar hoje?",
};

const AI_TOOLS: AiToolCard[] = [
  {
    name: "Tradutor de linguagem técnica",
    description: "Converta jargão técnico de apólices em explicações para o cliente.",
    href: "/ferramentas",
  },
  {
    name: "Gerador de e-mail de prospecção",
    description: "Crie e-mails de prospecção personalizados em segundos.",
    href: "/ferramentas",
  },
  {
    name: "Gerador de conteúdo social",
    description: "Crie posts para redes sociais sobre seguros em poucos cliques.",
    href: "/ferramentas",
  },
];

function TranslateIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h7" />
      <path d="M8.5 5.5v2.5C8.5 11.5 6 14 3 14" />
      <path d="M5 11c1.6 1.6 3.6 2.5 5 2.5" />
      <path d="M13 21l4-9 4 9" />
      <path d="M14.5 18h5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D6E4F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6l-4 4H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8a4 4 0 0 1 0 8" />
      <path d="M17 5a8 8 0 0 1 0 14" />
    </svg>
  );
}

const AI_TOOL_ICONS: (() => React.ReactElement)[] = [TranslateIcon, MailIcon, MegaphoneIcon];

function pickMockResponse(question: string): string {
  const normalized = question.toLowerCase();

  if (normalized.includes("sinistralidade") || normalized.includes("auto")) {
    return MOCK_RESPONSES[0];
  }
  if (normalized.includes("circular") || normalized.includes("susep") || normalized.includes("regula")) {
    return MOCK_RESPONSES[1];
  }
  if (normalized.includes("comiss") || normalized.includes("corretor")) {
    return MOCK_RESPONSES[2];
  }
  return FALLBACK_RESPONSE;
}

export default function IaHubPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);

  function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (trimmed === "" || isThinking) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: pickMockResponse(trimmed),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);
    }, 900);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendQuestion(input);
  }

  function handleExampleClick(example: string) {
    setInput(example);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section aria-label="Introdução ao assistente de IA" className="mb-10 max-w-3xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#0D6E4F]">
          Inteligência Artificial
        </p>
        <h1 className="mt-2 font-sans text-[32px] font-extrabold leading-[44px] text-[#1A1A18]">
          Assistente de IA Segreport
        </h1>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-[#3D3D3A]">
          Um assistente de inteligência artificial especializado no mercado segurador
          brasileiro, treinado com dados da SUSEP, circulares regulatórias e notícias do
          setor. Tire dúvidas sobre produtos, regulação, sinistralidade, comissionamento
          e tendências de mercado em segundos.
        </p>
      </section>

      <section aria-label="Chat com o assistente de IA" className="mb-12">
        <div className="flex flex-col rounded-2xl border border-[rgba(0,0,0,.08)] bg-white">
          <div
            role="log"
            aria-live="polite"
            aria-label="Histórico de mensagens"
            className="flex max-h-[480px] min-h-[280px] flex-col gap-4 overflow-y-auto p-5"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-[#0D6E4F] px-4 py-3 font-sans text-[14px] leading-relaxed text-white"
                      : "max-w-[80%] rounded-2xl rounded-tl-sm bg-[#F7F7F5] px-4 py-3 font-sans text-[14px] leading-relaxed text-[#1A1A18]"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#F7F7F5] px-4 py-3 font-sans text-[14px] text-[#76766F]">
                  Pensando...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[rgba(0,0,0,.06)] px-5 py-4">
            <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-wide text-[#76766F]">
              Exemplos de perguntas
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => handleExampleClick(example.label)}
                  className="rounded-full border border-[rgba(0,0,0,.08)] bg-[#F7F7F5] px-3.5 py-1.5 font-sans text-[13px] text-[#3D3D3A] transition-colors hover:border-[#0D6E4F] hover:text-[#0D6E4F]"
                >
                  {example.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label htmlFor="ia-chat-input" className="sr-only">
                Digite sua pergunta para o assistente de IA
              </label>
              <input
                id="ia-chat-input"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pergunte sobre seguros, regulação ou tendências do mercado..."
                className="flex-1 rounded-full border border-[rgba(0,0,0,.08)] bg-[#F7F7F5] px-4 py-2.5 font-sans text-[14px] text-[#1A1A18] outline-none focus:border-[#0D6E4F]"
              />
              <button
                type="submit"
                disabled={isThinking || input.trim() === ""}
                aria-label="Enviar pergunta"
                className="inline-flex items-center justify-center rounded-full bg-[#0D6E4F] px-5 py-2.5 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </section>

      <section aria-label="Outras ferramentas de IA" className="mb-12">
        <h2 className="mb-4 font-sans text-[20px] font-bold text-[#1A1A18]">
          Outras ferramentas de IA
        </h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {AI_TOOLS.map((tool, index) => {
            const Icon = AI_TOOL_ICONS[index];
            return (
              <li key={tool.name}>
                <a
                  href={tool.href}
                  className="flex h-full flex-col gap-4 rounded-xl border border-[rgba(0,0,0,.08)] bg-white p-5 transition-colors hover:border-[#0D6E4F]"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E6F2ED]"
                    aria-hidden="true"
                  >
                    <Icon />
                  </span>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <h3 className="font-sans text-[16px] font-bold leading-snug text-[#1A1A18]">
                      {tool.name}
                    </h3>
                    <p className="font-sans text-[13px] leading-snug text-[#3D3D3A]">
                      {tool.description}
                    </p>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Conheça o plano Premium">
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-[#1A1A18] p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#12956A]">
              Segreport Premium
            </p>
            <h2 className="mt-2 font-sans text-[22px] font-extrabold text-white">
              Acesso ilimitado ao assistente de IA
            </h2>
            <p className="mt-2 max-w-xl font-sans text-[14px] text-[#E6F2ED]">
              Faça perguntas sem limite de uso, receba respostas com profundidade
              analítica e tenha prioridade em novas funcionalidades de inteligência
              artificial da Segreport.
            </p>
          </div>
          <a
            href="/premium"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#0D6E4F] px-6 py-3 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Conhecer o Premium
          </a>
        </div>
      </section>
    </main>
  );
}
