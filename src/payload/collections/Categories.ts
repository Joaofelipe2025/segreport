import type { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "label",
  },
  fields: [
    { name: "label", type: "text", label: "Nome", required: true },
    {
      name: "key",
      type: "text",
      label: "Chave (slug)",
      required: true,
      admin: { description: "Ex: auto, vida, saude" },
    },
    { name: "slug", type: "text", label: "URL slug", required: true },
    { name: "color", type: "text", label: "Cor hex", required: true },
    { name: "emoji", type: "text", label: "Emoji", required: true },
  ],
};
