import { defineField, defineType } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export const article = defineType({
  name: "article",
  title: "Artigo",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "content", title: "Conteúdo", default: true },
    { name: "meta", title: "Metadados" },
    { name: "media", title: "Mídia" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      group: "content",
      validation: (r) => r.required().min(10).max(200),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      group: "meta",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "summary",
      title: "Resumo / Chamada",
      type: "text",
      rows: 3,
      group: "content",
      description: "Texto de chamada exibido nas listagens e cards",
      validation: (r) => r.required().max(300),
    }),
    defineField({
      name: "mainImage",
      title: "Imagem principal",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: [
        { name: "alt", type: "string", title: "Texto alternativo" },
        { name: "caption", type: "string", title: "Legenda" },
        { name: "credit", type: "string", title: "Crédito" },
      ],
    }),
    defineField({
      name: "videoUrl",
      title: "URL de vídeo (YouTube / Vimeo)",
      type: "url",
      group: "media",
      description: "Se preenchido, exibe o vídeo no topo do artigo",
    }),
    defineField({
      name: "body",
      title: "Corpo do artigo",
      type: "blockContent",
      group: "content",
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "reference",
      to: [{ type: "author" }],
      group: "meta",
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "reference",
      to: [{ type: "category" }],
      group: "meta",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      group: "meta",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
    }),
    defineField({
      name: "featured",
      title: "Destaque",
      type: "boolean",
      group: "meta",
      description: "Exibe no topo/hero da página",
      initialValue: false,
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "meta",
      options: {
        list: [
          { title: "Rascunho", value: "draft" },
          { title: "Publicado", value: "published" },
          { title: "Arquivado", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Data de publicação",
      type: "datetime",
      group: "meta",
    }),
    defineField({
      name: "seoTitle",
      title: "Título SEO",
      type: "string",
      group: "meta",
      description: "Se vazio, usa o título do artigo",
    }),
    defineField({
      name: "seoDescription",
      title: "Descrição SEO",
      type: "text",
      rows: 2,
      group: "meta",
    }),
  ],
  preview: {
    select: {
      title: "title",
      author: "author.name",
      media: "mainImage",
      status: "status",
    },
    prepare({ title, author, media, status }) {
      const statusEmoji = status === "published" ? "✅" : status === "draft" ? "✏️" : "📦";
      return {
        title: `${statusEmoji} ${title}`,
        subtitle: author ? `Por ${author}` : "Sem autor",
        media,
      };
    },
  },
  orderings: [
    { title: "Data de publicação (recente)", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
    { title: "Título A-Z", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
  ],
});
