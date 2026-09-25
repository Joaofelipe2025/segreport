/**
 * Os estados editoriais, num lugar só.
 *
 * Estavam copiados em `materias/page.tsx`, em `EditorDeMateria.tsx` e na
 * máquina de estados do banco. Três cópias de uma lista é uma divergência
 * esperando acontecer — e a divergência que já aconteceu foi de taxonomia,
 * com o banco em `agro` e o portal em `agronegocio`.
 */

export const ESTADOS_EDITORIAIS = [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "archived",
] as const;

export type EstadoEditorial = (typeof ESTADOS_EDITORIAIS)[number];

const ROTULOS: Record<EstadoEditorial, string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  scheduled: "Agendada",
  published: "Publicada",
  archived: "Arquivada",
};

const CORES: Record<EstadoEditorial, string> = {
  draft: "bg-paper text-ink-3",
  in_review: "bg-[#fbf6e0] text-[#7d6612]",
  scheduled: "bg-[#e6f0fb] text-[#1f5590]",
  published: "bg-[#e7f5ec] text-[#1e6b40]",
  archived: "bg-paper text-ink-4",
};

/** O filtro chega pela URL, que aceita qualquer coisa. Só passa o que é estado. */
export function estadoValido(valor: unknown): valor is EstadoEditorial {
  return (
    typeof valor === "string" && (ESTADOS_EDITORIAIS as readonly string[]).includes(valor)
  );
}

/**
 * Estado desconhecido devolve o próprio valor em vez de string vazia: se um
 * dia o banco ganhar um sexto estado, a tela mostra o nome cru — feio, mas
 * informativo — em vez de um vão em branco sem explicação.
 */
export function rotuloDeEstado(estado: string): string {
  return estadoValido(estado) ? ROTULOS[estado] : estado;
}

export function corDeEstado(estado: string): string {
  return estadoValido(estado) ? CORES[estado] : "bg-paper text-ink-4";
}
