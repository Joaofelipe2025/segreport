import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { papelValido, podeAcessarPainel, type Role } from "./rules";
import { FalhaDeConsulta } from "@/lib/painel/consulta";

export type { Role };

export interface SessionProfile {
  id: string;
  email: string;
  role: Role;
  /** Assinatura pública. Nulo para quem não é colunista. */
  authorId: string | null;
}

/**
 * Perfil de quem está pedindo, ou null se não houver sessão.
 *
 * O papel é lido do banco a cada chamada, não do token: papel revogado
 * precisa valer na requisição seguinte, e não só no próximo login.
 *
 * O e-mail vem de `auth.users` pela sessão — `profiles` não guarda essa
 * coluna.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;

  // Erro de consulta NÃO pode virar "sem sessão".
  //
  // Esta é a leitura mais executada do painel, e descartar o `error` aqui
  // criava um laço fechado: a leitura falha, o perfil vem nulo, `requirePainel`
  // manda para a porta dizendo "sua sessão expirou", a pessoa pede link novo,
  // entra, e volta para a mesma mensagem. Sem erro em lugar nenhum e sem
  // saída. É a lição desta fase inteira, no lugar onde mais dói.
  const { data: profile, error: erroPerfil } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (erroPerfil) {
    throw new FalhaDeConsulta("seu perfil", erroPerfil.message);
  }
  if (!profile || !papelValido(profile.role)) return null;

  const { data: author, error: erroAutor } = await supabase
    .from("authors")
    .select("id")
    .eq("profile_id", auth.user.id)
    .maybeSingle();

  if (erroAutor) {
    throw new FalhaDeConsulta("sua assinatura pública", erroAutor.message);
  }

  return {
    id: profile.id,
    email: auth.user.email ?? "",
    role: profile.role,
    authorId: author?.id ?? null,
  };
}

/**
 * Exige um dos papéis, redirecionando quando não houver.
 *
 * É conveniência de navegação, não a barreira de segurança: quem garante é a
 * RLS. Se esta função falhasse, o usuário veria uma tela vazia — não dados
 * alheios.
 */
export async function requireRole(roles: Role[]): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/painel/entrar?motivo=sessao");
  if (!roles.includes(profile.role)) redirect("/painel/entrar?motivo=permissao");
  return profile;
}

/** Atalho para as rotas do painel. */
export async function requirePainel(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/painel/entrar?motivo=sessao");
  if (!podeAcessarPainel(profile.role)) redirect("/painel/entrar?motivo=permissao");
  return profile;
}
