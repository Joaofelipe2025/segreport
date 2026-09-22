import { defineConfig } from "vitest/config";

export default defineConfig({
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
