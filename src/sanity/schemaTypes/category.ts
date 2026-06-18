import { defineField, defineType } from "sanity";
import { FolderIcon } from "@sanity/icons";

export const category = defineType({
  name: "category",
  title: "Categoria",
  type: "document",
  icon: FolderIcon,
  fields: [
    defineField({ name: "title", title: "Nome", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "description", title: "Descrição", type: "text", rows: 2 }),
    defineField({
      name: "color",
      title: "Cor",
      type: "string",
      description: "Cor hex para o filtro (ex: #0D6E4F)",
    }),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
