import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Há um package-lock.json no diretório do usuário que faz o Turbopack
  // inferir a raiz errada. Fixar aqui evita que ele suba um nível.
  turbopack: {
    root: import.meta.dirname,
  },
  // Nenhum domínio remoto de imagem: as imagens do preview são geradas
  // localmente pela rota /preview. Quando o upload do CMS entrar, o bucket
  // do Supabase Storage é declarado aqui em `images.remotePatterns`.
  images: {
    // Os padrões do Next geram oito larguras por imagem, e a home tem mais de
    // trinta imagens — o que produzia duzentas variantes para gerar e guardar.
    // Estas cobrem os pontos de quebra que o layout realmente usa.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [116, 256, 384],
  },
};

export default nextConfig;
