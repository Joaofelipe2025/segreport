"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { enviarCapa } from "../upload";
import { problemaNoArquivo } from "@/lib/painel/upload";

/**
 * Capa da matéria, enviada do computador.
 *
 * Era um campo de texto para colar URL — o que só funciona para quem já tem a
 * imagem hospedada em algum lugar, ou seja, quase ninguém numa redação.
 *
 * O valor que o formulário grava continua sendo `cover_url` num input
 * escondido: o envio acontece antes, por conta própria, e o que sobra para o
 * Salvar é o endereço. Assim enviar a imagem e salvar a matéria são duas
 * coisas independentes, e perder uma não perde a outra.
 *
 * A descrição é exigida no envio, não depois: `media_assets.alt` é `not null`
 * no banco, e imagem sem descrição desaparece para quem usa leitor de tela.
 */
export default function CampoDeCapa({ inicial }: { inicial: string }) {
  const [url, setUrl] = useState(inicial);
  const [alt, setAlt] = useState("");
  const [escolhido, setEscolhido] = useState<File | null>(null);
  const [aviso, setAviso] = useState<{ tom: "erro" | "ok"; texto: string }>();
  const [enviando, iniciar] = useTransition();
  const entrada = useRef<HTMLInputElement>(null);

  function escolher(arquivo: File | null) {
    setAviso(undefined);
    const problema = problemaNoArquivo(arquivo);
    if (problema) {
      setEscolhido(null);
      setAviso({ tom: "erro", texto: problema });
      return;
    }
    setEscolhido(arquivo);
  }

  function enviar() {
    if (!escolhido) return;
    const dados = new FormData();
    dados.set("arquivo", escolhido);
    dados.set("alt", alt);

    iniciar(async () => {
      const r = await enviarCapa({ status: "inicial" }, dados);
      if (r.status === "enviado" && r.url) {
        setUrl(r.url);
        setEscolhido(null);
        setAlt("");
        if (entrada.current) entrada.current.value = "";
        setAviso({ tom: "ok", texto: r.mensagem ?? "Imagem enviada." });
      } else {
        setAviso({ tom: "erro", texto: r.mensagem ?? "Não foi possível enviar." });
      }
    });
  }

  return (
    <div>
      {/* O que o Salvar grava. O envio já aconteceu quando isto tem valor. */}
      <input type="hidden" name="cover_url" value={url} />

      {url ? (
        <div className="overflow-hidden rounded-lg border border-hairline">
          <div className="relative aspect-[3/2] bg-paper">
            <Image
              src={url}
              alt="Capa escolhida para esta matéria"
              fill
              sizes="260px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between gap-2 px-2.5 py-2">
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="text-[11px] font-medium text-forest-700 hover:underline"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setAviso(undefined);
              }}
              className="text-[11px] font-medium text-ink-3 hover:text-down"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-hairline bg-white px-3 py-6 text-center transition-colors hover:border-forest-500"
        >
          <span className="text-xs font-medium text-forest-700">Escolher imagem</span>
          <span className="mt-1 text-[11px] text-ink-4">JPG, PNG, WebP ou AVIF, até 5 MB</span>
        </button>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => escolher(e.target.files?.[0] ?? null)}
      />

      {escolhido && (
        <div className="mt-2 rounded-lg border border-hairline bg-paper p-2.5">
          <p className="truncate text-[11px] text-ink-2" title={escolhido.name}>
            {escolhido.name}{" "}
            <span className="text-ink-4">
              ({(escolhido.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </p>
          <label htmlFor="alt-da-capa" className="mt-2 block text-[11px] text-ink-3">
            Descreva a imagem
          </label>
          <input
            id="alt-da-capa"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Fachada da sede da Susep, em Brasília"
            className="mt-1 w-full rounded border border-hairline bg-white px-2 py-1.5 text-[12px] outline-none focus:border-forest-500"
          />
          <button
            type="button"
            disabled={enviando || alt.trim().length < 3}
            onClick={enviar}
            className="mt-2 w-full rounded bg-forest-800 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-forest-700 disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Enviar imagem"}
          </button>
        </div>
      )}

      {aviso && (
        <p
          role={aviso.tom === "erro" ? "alert" : "status"}
          className={`mt-2 text-[11px] leading-relaxed ${aviso.tom === "erro" ? "text-down" : "text-forest-700"}`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
