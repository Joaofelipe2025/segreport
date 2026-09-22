import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Há um package-lock.json no diretório do usuário que faz o Turbopack
  // inferir a raiz errada. Fixar aqui evita que ele suba um nível.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      // Fotos do preview. Trocar pelo bucket do Supabase Storage quando o
      // upload do CMS entrar (sub-projeto 3).
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
