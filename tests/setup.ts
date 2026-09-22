import { config } from "dotenv";

/**
 * Carrega as variáveis do banco de testes.
 *
 * Explicitamente `.env.test`, e não `.env.local`: apontar os testes para o
 * mesmo banco da aplicação faria a suíte escrever no ambiente real. O
 * arquivo fica fora do controle de versão.
 */
config({ path: ".env.test" });
