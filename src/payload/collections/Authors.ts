import type { CollectionConfig } from "payload";

export const Authors: CollectionConfig = {
  slug: "authors",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    { name: "name", type: "text", label: "Nome", required: true },
    { name: "bio", type: "textarea", label: "Bio" },
    { name: "email", type: "email", label: "E-mail" },
    { name: "twitter_handle", type: "text", label: "Twitter" },
    {
      name: "avatar",
      type: "upload",
      label: "Avatar",
      relationTo: "media",
    },
  ],
};
