import type { Metadata } from "next";
import LegalPage from "@/components/portal/LegalPage";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      intro="Condições para navegação, assinatura e uso dos dados publicados no SegReport."
      sections={[
        { heading: "Uso do conteúdo editorial", body: "As matérias e colunas publicadas no portal são de livre leitura. A reprodução integral depende de autorização prévia; a citação com link para a fonte é permitida e incentivada." },
        { heading: "Dados do Hub Inteligência", body: "Os indicadores, rankings e relatórios do Hub Inteligência são destinados ao uso do assinante. A redistribuição, revenda ou incorporação dos dados em produto de terceiro exige contrato específico." },
        { heading: "Natureza das informações", body: "O conteúdo publicado tem finalidade informativa e não constitui recomendação de contratação, investimento ou decisão de subscrição. Cada indicador traz sua fonte e data de apuração para verificação independente." },
        { heading: "Assinaturas", body: "As assinaturas são renovadas automaticamente até o cancelamento, que pode ser feito a qualquer momento e passa a valer no fim do ciclo vigente." },
      ]}
    />
  );
}
