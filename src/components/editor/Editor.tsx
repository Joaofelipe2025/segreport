"use client";

import { EditorContent, useEditor, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback } from "react";
import { BLOCOS_PROPRIOS } from "@/lib/editor/extensions";
import type { DocumentoBlocos } from "@/lib/editor/document";

/**
 * Superfície de escrita da matéria.
 *
 * O editor de blocos é visual por natureza — o que você digita é o que sai.
 * Foi por isso que a pré-visualização lado a lado foi descartada no
 * brainstorming: gastaria metade da tela repetindo.
 */
export default function Editor({
  inicial,
  onChange,
}: {
  inicial: DocumentoBlocos;
  onChange: (doc: DocumentoBlocos) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit, ...BLOCOS_PROPRIOS],
    content: inicial,
    // O Next renderiza no servidor primeiro; sem isto o React acusa
    // divergência de hidratação ao montar o editor no cliente.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[420px] focus:outline-none text-[17px] leading-[1.75] text-ink-2",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as DocumentoBlocos),
  });

  if (!editor) {
    return <div className="min-h-[420px] animate-pulse rounded-lg bg-paper" />;
  }

  return (
    <div>
      <Barra editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Barra({ editor }: { editor: TiptapEditor }) {
  const inserirGrafico = useCallback(() => {
    const chave = window.prompt(
      "Chave do indicador (ex.: premios-saude, sinistralidade-auto)"
    );
    if (!chave?.trim()) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "indicatorChart",
        attrs: { indicatorKey: chave.trim(), months: 12 },
      })
      .run();
  }, [editor]);

  const inserirRestrito = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "proBox",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Trecho para assinantes." }] }],
      })
      .run();
  }, [editor]);

  const inserirRelacionadas = useCallback(() => {
    const bruto = window.prompt("Slugs das matérias relacionadas, separados por vírgula");
    const slugs = (bruto ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (slugs.length === 0) return;
    editor.chain().focus().insertContent({ type: "relatedArticles", attrs: { slugs } }).run();
  }, [editor]);

  return (
    <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap items-center gap-1 border-b border-hairline bg-white/95 px-1 py-2 backdrop-blur">
      <Botao
        ativo={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        titulo="Negrito"
      >
        <strong>B</strong>
      </Botao>
      <Botao
        ativo={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        titulo="Itálico"
      >
        <em>I</em>
      </Botao>

      <Divisor />

      <Botao
        ativo={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        titulo="Subtítulo"
      >
        H2
      </Botao>
      <Botao
        ativo={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        titulo="Subtítulo menor"
      >
        H3
      </Botao>
      <Botao
        ativo={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        titulo="Citação"
      >
        &ldquo;
      </Botao>
      <Botao
        ativo={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        titulo="Lista"
      >
        •
      </Botao>

      <Divisor />

      {/* Blocos próprios do SegReport — o que distingue este editor */}
      <Botao onClick={inserirGrafico} titulo="Gráfico de indicador do Hub" destaque>
        ⚡ Indicador
      </Botao>
      <Botao onClick={inserirRestrito} titulo="Trecho restrito a assinantes" destaque>
        🔒 PRO
      </Botao>
      <Botao onClick={inserirRelacionadas} titulo="Matérias relacionadas" destaque>
        ↗ Relacionadas
      </Botao>
    </div>
  );
}

function Divisor() {
  return <span className="mx-1 h-5 w-px bg-hairline" aria-hidden="true" />;
}

function Botao({
  children,
  onClick,
  ativo,
  titulo,
  destaque,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ativo?: boolean;
  titulo: string;
  destaque?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      className={`rounded px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
        ativo
          ? "bg-forest-800 text-lime-400"
          : destaque
            ? "bg-forest-100 text-forest-700 hover:bg-forest-200"
            : "text-ink-2 hover:bg-paper"
      }`}
    >
      {children}
    </button>
  );
}
