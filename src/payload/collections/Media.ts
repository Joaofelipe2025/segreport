import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "filename",
  },
  upload: {
    staticDir: "public/media",
    imageSizes: [
      { name: "thumbnail", width: 400, height: 250, position: "centre" },
      { name: "card", width: 768, height: 480, position: "centre" },
      { name: "hero", width: 1240, height: 620, position: "centre" },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
  },
  fields: [
    { name: "alt", type: "text", label: "Texto alternativo" },
  ],
};
