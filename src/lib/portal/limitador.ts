/**
 * Limitador de tentativas por origem, em memória.
 *
 * O QUE ELE NÃO É: proteção completa. Na Vercel cada instância tem a própria
 * memória, então a cota real é por instância, não global, e nada disso alcança
 * quem bate direto no PostgREST do Supabase em vez de passar pelo site.
 *
 * O que ele resolve é o caso comum e barato: um laço simples contra o
 * formulário público. A trava de verdade é a política no banco, que exige
 * SQL — está escrita em `supabase/migrations/` como endurecimento opcional, e
 * o recurso funciona sem ela.
 *
 * Preferi isto a uma dependência externa de limitação: uma tabela em memória
 * com poda é pouca coisa, e o que ela faz fica inteiro à vista.
 */

interface Opcoes {
  cota: number;
  janelaMs: number;
  /** Teto de origens memorizadas, para o mapa não crescer sem fim. */
  maxChaves?: number;
}

interface Registro {
  contagem: number;
  expiraEm: number;
}

export interface Limitador {
  /** `false` quando a origem estourou a cota. Origem nula sempre passa. */
  permite(origem: string | null, agora?: number): boolean;
  tamanho(): number;
}

export function criarLimitador({ cota, janelaMs, maxChaves = 5000 }: Opcoes): Limitador {
  const mapa = new Map<string, Registro>();

  function podar(agora: number) {
    // Só remove o que JÁ VENCEU. Remover quem está no limite deixaria um
    // atacante zerar a punição alheia só gerando chaves novas.
    for (const [chave, reg] of mapa) {
      if (reg.expiraEm <= agora) mapa.delete(chave);
    }
  }

  return {
    permite(origem, agora = Date.now()) {
      // Sem origem identificável — atrás de proxy que não manda o IP — todos
      // cairiam na mesma chave, e um visitante barraria os outros. Melhor não
      // limitar do que limitar a pessoa errada.
      if (!origem) return true;

      if (mapa.size >= maxChaves) podar(agora);

      const reg = mapa.get(origem);
      if (!reg || reg.expiraEm <= agora) {
        if (mapa.size >= maxChaves) return true; // mapa cheio de entradas vivas: não pune quem chegou agora
        mapa.set(origem, { contagem: 1, expiraEm: agora + janelaMs });
        return true;
      }

      if (reg.contagem >= cota) return false;
      reg.contagem += 1;
      return true;
    },
    tamanho: () => mapa.size,
  };
}

/**
 * O IP de quem pediu, conforme a Vercel entrega.
 *
 * `x-forwarded-for` pode vir com uma cadeia; o primeiro é o cliente. Nulo
 * quando não dá para saber — e aí o limitador deixa passar, de propósito.
 */
export function origemDaRequisicao(cabecalhos: Headers): string | null {
  const direto = cabecalhos.get("x-real-ip");
  if (direto) return direto.trim();

  const cadeia = cabecalhos.get("x-forwarded-for");
  const primeiro = cadeia?.split(",")[0]?.trim();
  return primeiro || null;
}
