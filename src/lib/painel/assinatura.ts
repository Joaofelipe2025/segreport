import { slugDeNome } from "@/lib/auth/rules";

/**
 * O endereço público do colunista.
 *
 * Antes era sempre derivado do nome, a cada salvamento, e não havia campo
 * para ele. Corrigir "Ana Paula Costa" para "Ana P. Costa" reescrevia o slug
 * e transformava `/colunistas/ana-paula-costa` em 404 — para todo link
 * indexado, compartilhado ou citado. Sem redirecionamento e sem aviso.
 *
 * Agora o campo existe e o nome só serve de padrão para quem nunca mexeu.
 *
 * Devolve nulo quando não sobra nada utilizável: `slugDeNome` só preserva
 * `[a-z0-9]`, então um nome fora do alfabeto latino produzia string vazia —
 * e `authors.slug` não tem restrição de não-vazio, então o vazio era gravado
 * e a página do colunista quebrava. Nulo aqui vira recusa com explicação.
 */
export function slugDeAssinatura(slugDigitado: string, nome: string): string | null {
  const daPessoa = slugDeNome(slugDigitado);
  if (daPessoa) return daPessoa;

  const doNome = slugDeNome(nome);
  return doNome || null;
}
