import type { CollectionConfig } from "payload";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "status", "publishedAt"],
    listSearchableFields: ["title", "excerpt"],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Título",
      required: true,
    },
    {
      name: "subtitle",
      type: "text",
      label: "Subtítulo / Chapéu",
    },
    {
      name: "slug",
      type: "text",
      label: "Slug (URL)",
      required: true,
      unique: true,
      admin: {
        description: "Gerado automaticamente a partir do título",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return (data.title as string)
                .toLowerCase()
                .normalize("NFD")
                .replace(/[̀-ͯ]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      label: "Resumo / Chamada",
    },
    {
      name: "cover",
      type: "upload",
      label: "Imagem de capa",
      relationTo: "media",
    },
    {
      name: "content",
      type: "richText",
      label: "Conteúdo",
      required: true,
    },
    {
      name: "category",
      type: "relationship",
      label: "Categoria",
      relationTo: "categories",
      required: true,
    },
    {
      name: "author",
      type: "relationship",
      label: "Autor",
      relationTo: "authors",
    },
    {
      name: "isPremium",
      type: "checkbox",
      label: "Conteúdo Premium",
      defaultValue: false,
    },
    {
      name: "readingTime",
      type: "number",
      label: "Tempo de leitura (min)",
      admin: { description: "Estimativa em minutos" },
    },
    {
      name: "publishedAt",
      type: "date",
      label: "Publicado em",
      admin: {
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      defaultValue: "draft",
      options: [
        { label: "Rascunho", value: "draft" },
        { label: "Publicado", value: "published" },
        { label: "Arquivado", value: "archived" },
      ],
    },
  ],
};
