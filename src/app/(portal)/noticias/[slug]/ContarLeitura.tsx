"use client";

import { useEffect, useRef } from "react";
import { registrarLeitura } from "./contagem";

/**
 * Conta a leitura uma vez, no navegador.
 *
 * `sessionStorage` evita que recarregar a página conte de novo — leitor que
 * atualiza para ver se saiu correção não são três leituras. A contagem volta
 * a valer em nova aba ou nova sessão, que é o comportamento esperado.
 *
 * O ref protege do StrictMode, que monta o componente duas vezes em
 * desenvolvimento e dobraria a contagem local.
 */
export default function ContarLeitura({ slug }: { slug: string }) {
  const jaContou = useRef(false);

  useEffect(() => {
    if (jaContou.current) return;
    jaContou.current = true;

    const chave = `segreport-leu-${slug}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {
      // Navegador com armazenamento bloqueado: conta assim mesmo. Perder a
      // deduplicação é melhor do que perder a métrica.
    }

    void registrarLeitura(slug);
  }, [slug]);

  return null;
}
