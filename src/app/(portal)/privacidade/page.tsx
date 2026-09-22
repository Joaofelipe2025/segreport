import type { Metadata } from "next";
import LegalPage from "@/components/portal/LegalPage";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      intro="Como o SegReport trata os dados pessoais de leitores e assinantes, conforme a LGPD."
      sections={[
        { heading: "Dados que coletamos", body: "Nome e e-mail no cadastro, dados de pagamento processados pelo provedor de cobrança, e registros de navegação usados para medir audiência e desempenho de campanhas publicitárias." },
        { heading: "Finalidade", body: "Autenticar o acesso, entregar a newsletter, controlar o nível de assinatura e apurar audiência. Não vendemos nem cedemos a base de leitores a terceiros." },
        { heading: "Publicidade", body: "A publicidade é servida pelo nosso próprio sistema, sem redes programáticas de terceiros. Contamos impressões e cliques de forma agregada, sem construir perfil individual para venda." },
        { heading: "Seus direitos", body: "Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados a qualquer momento pelo canal de contato." },
      ]}
    />
  );
}
