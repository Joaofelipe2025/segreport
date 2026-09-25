"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { AVISO_DE_SAIDA, deveAvisarAoSair } from "@/lib/painel/saida";

/**
 * Quem está com trabalho não salvo, e quem precisa saber disso.
 *
 * O editor é quem sabe que há texto pendente; a barra lateral é quem oferece
 * a saída. Estão em ramos diferentes da árvore, então o aviso precisa de um
 * lugar comum. O contexto vive no layout do painel, acima dos dois.
 *
 * Só o editor escreve aqui. Se um dia outra tela tiver rascunho, ela chama o
 * mesmo `marcarSujo` e ganha o aviso de graça.
 */
interface Estado {
  sujo: boolean;
  marcarSujo: (valor: boolean) => void;
}

const Contexto = createContext<Estado>({ sujo: false, marcarSujo: () => {} });

export function useGuardaDeSaida(): Estado {
  return useContext(Contexto);
}

export function ProvedorDeGuarda({ children }: { children: ReactNode }) {
  const [sujo, setSujo] = useState(false);
  return (
    <Contexto.Provider value={{ sujo, marcarSujo: setSujo }}>{children}</Contexto.Provider>
  );
}

/**
 * `Link` que pergunta antes de descartar trabalho.
 *
 * `onNavigate` só roda em navegação do próprio app e expõe `preventDefault()`
 * — é o gancho que o `beforeunload` não alcança. Abrir em nova aba
 * (Ctrl/Cmd+clique) não dispara o evento, e está certo: nada é descartado.
 */
export function LinkGuardado({
  href,
  children,
  ...resto
}: React.ComponentProps<typeof Link>) {
  const { sujo, marcarSujo } = useGuardaDeSaida();
  const atual = usePathname();

  return (
    <Link
      href={href}
      onNavigate={(e) => {
        if (!deveAvisarAoSair(sujo, atual, String(href))) return;
        if (window.confirm(AVISO_DE_SAIDA)) {
          // Saiu por decisão própria: a página seguinte não herda a marca.
          marcarSujo(false);
          return;
        }
        e.preventDefault();
      }}
      {...resto}
    >
      {children}
    </Link>
  );
}
