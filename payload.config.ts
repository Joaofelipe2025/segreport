import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Articles } from "./src/payload/collections/Articles";
import { Categories } from "./src/payload/collections/Categories";
import { Authors } from "./src/payload/collections/Authors";
import { Media } from "./src/payload/collections/Media";
import { Users } from "./src/payload/collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: "— Segreport CMS",
    },
  },
  collections: [Articles, Categories, Authors, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "fallback-dev-secret",
  typescript: {
    outputFile: path.resolve(dirname, "src/payload/payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI as string,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    },
    schemaName: "payload",
    push: true,
  }),
  sharp,
});
