import type { Metadata, Viewport } from "next";
import { Poppins, DM_Mono } from "next/font/google";
import "./globals.css";
import CapturarRetornoDeLogin from "@/components/auth/CapturarRetornoDeLogin";

// next/font hospeda as fontes junto com o build — sem request para o Google,
// sem layout shift. Substitui o @import que havia no globals.css.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://segreport.com.br"),
  title: {
    default: "SegReport — Inteligência do Mercado Segurador",
    template: "%s · SegReport",
  },
  description:
    "Notícias, dados e inteligência para profissionais do mercado segurador brasileiro. Indicadores por ramo, rankings de seguradoras e radar regulatório.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SegReport",
    title: "SegReport — Inteligência do Mercado Segurador",
    description:
      "Notícias, dados e inteligência para o mercado segurador brasileiro.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#16301f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${dmMono.variable}`}>
      <body>
        {/* Rede de proteção: retorno de login que caia fora de /auth/confirm
            é encaminhado para lá, com o token intacto. */}
        <CapturarRetornoDeLogin />
        {children}
      </body>
    </html>
  );
}
