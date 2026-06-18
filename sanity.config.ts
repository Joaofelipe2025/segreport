import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemaTypes";

export default defineConfig({
  name: "segreport",
  title: "Segreport CMS",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Conteúdo")
          .items([
            S.listItem()
              .title("Artigos")
              .child(
                S.list()
                  .title("Artigos por status")
                  .items([
                    S.listItem()
                      .title("Publicados")
                      .child(
                        S.documentList()
                          .title("Publicados")
                          .filter('_type == "article" && status == "published"')
                      ),
                    S.listItem()
                      .title("Rascunhos")
                      .child(
                        S.documentList()
                          .title("Rascunhos")
                          .filter('_type == "article" && status == "draft"')
                      ),
                    S.listItem()
                      .title("Todos")
                      .child(S.documentTypeList("article").title("Todos os artigos")),
                  ])
              ),
            S.divider(),
            S.documentTypeListItem("author").title("Autores / Colunistas"),
            S.documentTypeListItem("category").title("Categorias"),
            S.documentTypeListItem("tag").title("Tags"),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
});
