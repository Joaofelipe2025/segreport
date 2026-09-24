/**
 * Decisões de acesso, sem I/O.
 *
 * Tudo aqui é função pura de propósito: são as regras que definem quem entra
 * onde, e regra que não se consegue testar sem subir servidor acaba não sendo
 * testada. O trecho que fala com o Supabase fica em `session.ts`, fino o
 * bastante para não esconder decisão nenhuma.
 */

export type Role = "admin" | "columnist" | "reader";

const PAPEIS: readonly string[] = ["admin", "columnist", "reader"];

export function papelValido(valor: unknown): valor is Role {
  return typeof valor === "string" && PAPEIS.includes(valor);
}

export function emailValido(valor: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor.trim());
}

/**
 * Para onde o usuário vai depois de clicar no link do e-mail.
 *
 * Papel desconhecido ou ausente cai no Hub. Falha fechada: uma leitura que o
 * código não reconhece jamais pode virar acesso administrativo por omissão.
 */
export function destinoAposLogin(role: Role | string | null | undefined): string {
  return role === "admin" || role === "columnist" ? "/admin" : "/hub";
}

export function podeAcessarPainel(role: Role | string | null | undefined): boolean {
  return role === "admin" || role === "columnist";
}

export interface ItemDeMenu {
  href: string;
  rotulo: string;
}

const MENU: Array<ItemDeMenu & { papeis: Role[] }> = [
  { href: "/admin/materias", rotulo: "Matérias", papeis: ["admin", "columnist"] },
  { href: "/admin/colunistas", rotulo: "Colunistas", papeis: ["admin"] },
  { href: "/admin/midia", rotulo: "Mídia", papeis: ["admin", "columnist"] },
  { href: "/admin/ajustes", rotulo: "Ajustes", papeis: ["admin"] },
];

/** Seções visíveis para o papel. A RLS garante o resto. */
export function itensDeMenu(role: Role | string | null | undefined): ItemDeMenu[] {
  if (!papelValido(role)) return [];
  return MENU.filter((item) => item.papeis.includes(role)).map(({ href, rotulo }) => ({
    href,
    rotulo,
  }));
}

/** Slug de página pública a partir do nome do colunista. */
export function slugDeNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
