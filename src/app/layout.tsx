import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Ticker from '@/components/layout/Ticker'
import PulseStrip from '@/components/layout/PulseStrip'
import CategoryTabs from '@/components/layout/CategoryTabs'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Segreport — Inteligência do Mercado Segurador',
  description: 'Portal de notícias, dados e inteligência para corretores de seguros e profissionais do mercado segurador brasileiro.',
  metadataBase: new URL('https://segreport.com.br'),
  openGraph: {
    type: 'website',
    siteName: 'Segreport',
    title: 'Segreport — Inteligência do Mercado Segurador',
    description: 'Notícias e dados do mercado segurador brasileiro.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Header />
        <Ticker />
        <PulseStrip />
        <CategoryTabs />
        <main id="main">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  )
}
