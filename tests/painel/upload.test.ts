import { describe, expect, it } from "vitest";
import {
  LIMITE_DE_BYTES,
  TIPOS_ACEITOS,
  nomeNoBalde,
  problemaNoArquivo,
} from "@/lib/painel/upload";

const arquivo = (nome: string, tipo: string, bytes: number) =>
  ({ name: nome, type: tipo, size: bytes }) as File;

describe("validação do arquivo de capa", () => {
  it("aceita os formatos de imagem da web", () => {
    for (const tipo of TIPOS_ACEITOS) {
      expect(problemaNoArquivo(arquivo("capa.webp", tipo, 500_000))).toBeNull();
    }
  });

  it("recusa PDF, SVG e vídeo", () => {
    // SVG fica de fora de propósito: é XML, executa script no navegador, e
    // o balde é público. Imagem de capa não precisa disso.
    expect(problemaNoArquivo(arquivo("a.pdf", "application/pdf", 1000))).toContain("Formato");
    expect(problemaNoArquivo(arquivo("a.svg", "image/svg+xml", 1000))).toContain("Formato");
    expect(problemaNoArquivo(arquivo("a.mp4", "video/mp4", 1000))).toContain("Formato");
  });

  it("recusa arquivo acima do limite, dizendo o tamanho", () => {
    const p = problemaNoArquivo(arquivo("grande.jpg", "image/jpeg", LIMITE_DE_BYTES + 1));
    expect(p).toContain("5 MB");
  });

  it("aceita exatamente no limite", () => {
    expect(problemaNoArquivo(arquivo("no-limite.jpg", "image/jpeg", LIMITE_DE_BYTES))).toBeNull();
  });

  it("recusa arquivo vazio", () => {
    expect(problemaNoArquivo(arquivo("vazio.jpg", "image/jpeg", 0))).toContain("vazio");
  });

  it("recusa a ausência de arquivo", () => {
    expect(problemaNoArquivo(null)).toContain("Escolha uma imagem");
  });
});

describe("nome do arquivo no balde", () => {
  it("guarda a extensão certa para o tipo, não a do nome enviado", () => {
    // O nome vem do computador de quem envia e mente com frequência:
    // "foto.jpg" que na verdade é PNG. Quem manda é o tipo declarado.
    expect(nomeNoBalde("foto.jpg", "image/png", "abc123")).toBe("capas/abc123.png");
    expect(nomeNoBalde("foto.png", "image/webp", "abc123")).toBe("capas/abc123.webp");
  });

  it("não deixa o nome enviado influenciar o caminho", () => {
    // Nome com barra viraria pasta; com .. subiria de nível. O nome de
    // origem simplesmente não entra no caminho.
    const n = nomeNoBalde("../../etc/passwd.jpg", "image/jpeg", "abc123");
    expect(n).toBe("capas/abc123.jpg");
    expect(n).not.toContain("..");
  });

  it("jpeg vira .jpg, não .jpeg", () => {
    expect(nomeNoBalde("x", "image/jpeg", "id")).toBe("capas/id.jpg");
  });
});
