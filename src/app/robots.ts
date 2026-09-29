import type { MetadataRoute } from "next";
import { origemDoSite } from "@/lib/painel/origem";

/**
 * O que o buscador pode rastrear.
 *
 * As exclusões não são por segurança — quem protege é a RLS e o
 * `requirePainel()`. São para o rastreador não gastar a cota do site em
 * páginas que não rendem nada: painel, portas de entrada e o gerador de
 * imagens, que é caro por requisição.
 *
 * O Hub FICA liberado: as páginas de venda precisam ser encontradas, e o
 * conteúdo pago já é cortado na camada de dados antes de virar HTML.
 */
export default function robots(): MetadataRoute.Robots {
  const origem = origemDoSite();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/painel", "/auth", "/preview", "/login", "/cadastro"],
      },
    ],
    sitemap: `${origem}/sitemap.xml`,
    host: origem,
  };
}
