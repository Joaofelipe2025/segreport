import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Há um package-lock.json no diretório do usuário que faz o Turbopack
  // inferir a raiz errada. Fixar aqui evita que ele suba um nível.
  turbopack: {
    root: import.meta.dirname,
  },
  /**
   * Cabeçalhos de segurança.
   *
   * O site subiu só com HSTS. Sem `frame-ancestors`, qualquer um embute o
   * SegReport num iframe e monta uma fachada — num veículo de notícia isso
   * vira golpe com a sua marca.
   *
   * A CSP aqui cobre só `frame-ancestors` e `upgrade-insecure-requests`.
   * Uma CSP completa de script exige nonce por requisição, gerado no
   * middleware; sem isso ela quebra o próprio Next e acaba sendo removida na
   * primeira tela branca. Fica como trabalho próprio, não como remendo.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Duas camadas para a mesma coisa: `frame-ancestors` é o padrão
          // atual, `X-Frame-Options` cobre navegador antigo.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; upgrade-insecure-requests" },
          { key: "X-Frame-Options", value: "DENY" },
          // Impede o navegador de "adivinhar" o tipo de um arquivo enviado e
          // executá-lo como script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // O endereço completo não vaza para terceiros; o domínio, sim —
          // que é o que o veículo quer, para aparecer em relatório de origem.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // O portal não usa nada disso. Negar por padrão evita que um script
          // de anúncio futuro peça sozinho.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
  images: {
    // As capas enviadas pelo CMS moram no balde público `midia` do Supabase
    // Storage. O padrão é estreito de propósito: só este projeto, só este
    // balde. Qualquer outro host continua recusado, então uma URL colada de
    // fora não passa a ser servida pelo otimizador do Next.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/midia/**",
      },
    ],
    // Os padrões do Next geram oito larguras por imagem, e a home tem mais de
    // trinta imagens — o que produzia duzentas variantes para gerar e guardar.
    // Estas cobrem os pontos de quebra que o layout realmente usa.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [116, 256, 384],
  },
};

export default nextConfig;
