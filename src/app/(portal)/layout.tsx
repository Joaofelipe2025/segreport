import Header from "@/components/portal/Header";
import Nav from "@/components/portal/Nav";
import Ticker from "@/components/portal/Ticker";
import Footer from "@/components/portal/Footer";

/**
 * Casca do portal: claro, editorial, indexável.
 *
 * O Hub tem layout próprio — entrar nele é trocar de contexto, e essa
 * separação de route group é o que permite tratamentos visuais diferentes
 * sem condicional espalhada pelos componentes.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Nav />
      <Ticker />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
