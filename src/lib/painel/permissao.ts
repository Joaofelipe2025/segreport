import type { Role } from "@/lib/auth/rules";

/**
 * Quem pode EDITAR esta matéria.
 *
 * Direito de ler não é direito de editar, e a diferença importa no painel:
 * a RLS deixa qualquer um ler matéria publicada, então um colunista consegue
 * carregar a linha de uma matéria alheia já no ar. Sem esta checagem, o
 * editor abriria para ele e só o Salvar falharia — que é a pior combinação
 * possível, porque parece que dá.
 *
 * Espelha `articles_update_admin` e `articles_update_columnist` do banco. A
 * barreira continua sendo a RLS; isto é o que faz a interface contar a mesma
 * história que o banco.
 */
export function podeEditarMateria(
  papel: Role,
  authorIdDoPerfil: string | null,
  materia: { author_id: string | null; status: string }
): boolean {
  if (papel === "admin") return true;
  if (papel !== "columnist") return false;

  // Conta convidada antes de o autor ser criado: sem assinatura pública não
  // há o que comparar, e dois nulos não podem virar "é minha".
  if (!authorIdDoPerfil || !materia.author_id) return false;
  if (materia.author_id !== authorIdDoPerfil) return false;

  return materia.status === "draft" || materia.status === "in_review";
}
