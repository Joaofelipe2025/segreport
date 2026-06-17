import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Segreport",
  description: "Termos e condições de uso do portal Segreport.",
};

const SECTIONS = [
  { title: "1. Aceitação dos termos", body: "Ao acessar o Segreport, você concorda com estes Termos de Uso. Se não concordar com qualquer cláusula, não utilize o serviço. Reservamo-nos o direito de atualizar estes termos a qualquer momento." },
  { title: "2. Serviços oferecidos", body: "O Segreport oferece notícias, análises, dados regulatórios, ferramentas de cálculo e conteúdo editorial especializado no mercado segurador e ressegurador brasileiro, em versões gratuita e Premium." },
  { title: "3. Propriedade intelectual", body: "Todo o conteúdo do portal (textos, gráficos, dados, marcas) é de propriedade do Segreport ou de seus licenciantes. É proibida a reprodução total ou parcial sem autorização expressa, exceto para uso pessoal e não comercial." },
  { title: "4. Plano Premium", body: "A assinatura Premium é cobrada mensalmente via cartão de crédito. O cancelamento pode ser feito a qualquer momento, sem multa, e o acesso é mantido até o fim do período pago. Não há reembolso parcial de período em curso." },
  { title: "5. Conduta do usuário", body: "É proibido utilizar o portal para: disseminar desinformação, realizar scraping automatizado não autorizado, reproduzir conteúdo comercialmente sem licença, ou tentar comprometer a segurança dos sistemas." },
  { title: "6. Limitação de responsabilidade", body: "O Segreport não se responsabiliza por decisões de negócio tomadas com base no conteúdo publicado. O conteúdo é jornalístico e informativo, não constitui assessoria jurídica, financeira ou atuarial." },
  { title: "7. Foro e legislação", body: "Estes termos são regidos pela legislação brasileira. Qualquer litígio será submetido ao foro da Comarca de São Paulo-SP, com renúncia expressa a qualquer outro, por mais privilegiado que seja." },
];

export default function TermosPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 100px" }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green)", display: "block", marginBottom: 10 }}>
        Legal
      </span>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: 8 }}>
        Termos de Uso
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
