import { defineType, defineArrayMember } from "sanity";

export const blockContent = defineType({
  name: "blockContent",
  title: "Conteúdo",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "Citação", value: "blockquote" },
      ],
      lists: [
        { title: "Marcadores", value: "bullet" },
        { title: "Numerada", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Negrito", value: "strong" },
          { title: "Itálico", value: "em" },
          { title: "Sublinhado", value: "underline" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [{ name: "href", type: "url", title: "URL" }],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        { name: "alt", type: "string", title: "Texto alternativo" },
        { name: "caption", type: "string", title: "Legenda" },
      ],
    }),
    defineArrayMember({
      name: "videoEmbed",
      type: "object",
      title: "Vídeo (YouTube/Vimeo)",
      fields: [
        { name: "url", type: "url", title: "URL do vídeo" },
        { name: "caption", type: "string", title: "Legenda" },
      ],
    }),
  ],
});
