import { defineField, defineType } from "sanity";
import { UserIcon } from "@sanity/icons";

export const author = defineType({
  name: "author",
  title: "Autor / Colunista",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "name", title: "Nome completo", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name" }, validation: (r) => r.required() }),
    defineField({ name: "photo", title: "Foto", type: "image", options: { hotspot: true } }),
    defineField({
      name: "role",
      title: "Função",
      type: "string",
      options: {
        list: [
          { title: "Editor", value: "editor" },
          { title: "Colunista", value: "colunista" },
          { title: "Repórter", value: "reporter" },
          { title: "Redação", value: "redacao" },
        ],
      },
      initialValue: "reporter",
    }),
    defineField({ name: "bio", title: "Bio", type: "text", rows: 3 }),
    defineField({ name: "email", title: "E-mail", type: "string" }),
    defineField({ name: "twitter", title: "Twitter/X", type: "string" }),
    defineField({ name: "linkedin", title: "LinkedIn", type: "string" }),
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "photo" },
  },
});
