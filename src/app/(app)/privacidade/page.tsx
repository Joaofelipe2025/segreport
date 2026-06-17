import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Segreport",
  description: "Política de privacidade e proteção de dados do Segreport.",
};

const SECTIONS = [
  {
    title: "1. Dados coletados",
    body: "Coletamos dados fornecidos voluntariamente (nome, e-mail, empresa) no cadastro e na assinatura da newsletter. Também coletamos dados de navegação de forma anonimizada via cookies analíticos para melhorar a experiência do portal.",
  },
  {
    title: "2. Uso dos dados",
    body: "Os dados são utilizados exclusivamente para: envio da newsletter (quando solicitado), comunicações editoriais, personalização do conteúdo e análise estatística de audiência. Não vendemos dados a terceiros.",
  },
  {
    title: "3. Compartilhamento",
    body: "Dados podem ser compartilhados com parceiros de tecnologia (hospedagem, e-mail marketing) exclusivamente para operação do serviço, sempre sob acordo de confidencialidade alinhado à LGPD.",
  },
  {
    title: "4. Seus direitos (LGPD)",
    body: "Em conformidade com a Lei 13.709/2018 (LGPD), você tem direito a acessar, corrigir, excluir seus dados e revogar consentimento a qualquer momento. Para exercer esses direitos, entre em contato via privacidade@segreport.com.br.",
  },
  {
    title: "5. Cookies",
    body: "Utilizamos cookies essenciais (sessão, autenticação) e analíticos (Google Analytics anonimizado). Você pode desativar cookies analíticos nas configurações do seu navegador sem perda de funcionalidade.",
  },
  {
    title: "6. Retenção de dados",
    body: "Dados de cadastro são retidos enquanto a conta estiver ativa. Após encerramento, são anonimizados em até 30 dias. Dados de navegação são retidos por até 13 meses.",
  },
  {
    title: "7. Contato DPO",
    body: "Nosso encarregado de dados (DPO) pode ser contatado em: privacidade@segreport.com.br. Atendemos solicitações em até 15 dias úteis.",
  },
];

export default function PrivacidadePage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 100px" }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green)", display: "block", marginBottom: 10 }}>
        Legal
      </span>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: 8 }}>
        Política de Privacidade
      </h1>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-4)", marginBottom: 40 }}>
        Última atualização: 16 de junho de 2026 · Versão 2.0
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{s.title}</h2>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7 }}>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
