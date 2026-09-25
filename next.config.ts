import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Há um package-lock.json no diretório do usuário que faz o Turbopack
  // inferir a raiz errada. Fixar aqui evita que ele suba um nível.
  turbopack: {
    root: import.meta.dirname,
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
