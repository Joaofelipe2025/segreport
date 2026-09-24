import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Os testes importam módulos da aplicação pelo mesmo atalho @/ do tsconfig.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    // Os testes de RLS compartilham o mesmo banco. Rodar arquivos em paralelo
    // faria transações concorrentes disputarem as mesmas linhas semeadas, que
    // usam identificadores fixos.
    fileParallelism: false,
    testTimeout: 20000,
    include: ["tests/**/*.test.ts"],
  },
});
