import { enderecoDeCredito } from "@/lib/portal/credito";

export interface ProcedenciaBruta {
  origem: string | null;
  fonte_original_url: string | null;
  fonte_original_nome: string | null;
}

export interface ProcedenciaExibida {
  origem: string;
  endereco: string | null;
  /** Só existe quando o endereço serve de link; senão, o texto basta. */
  href: string | null;
  veiculo: string | null;
}

const ROTULO: Record<string, string> = {
  release: "Comunicado (release)",
  primaria: "Fonte primária",
  derivada: "Cobertura de terceiro",
};

/**
 * O que o painel mostra de onde a matéria veio.
 *
 * Quem confirma a checagem está avalizando a origem, então precisa vê-la. O
 * endereço vem de terceiro: só vira link se for um endereço que o portal
 * também aceitaria como crédito.
 */
export function procedenciaParaExibir(m: ProcedenciaBruta): ProcedenciaExibida | null {
  const endereco = m.fonte_original_url?.trim() || null;
  if (!m.origem && !endereco) return null;
  return {
    origem: m.origem ? (Object.hasOwn(ROTULO, m.origem) ? ROTULO[m.origem] : m.origem) : "Não informada",
    endereco,
    href: endereco && enderecoDeCredito(endereco) ? endereco : null,
    veiculo: m.fonte_original_nome?.trim() || null,
  };
}
