import { describe, expect, it } from "vitest";
import { origemDoSite } from "@/lib/painel/origem";

describe("endereço de onde o link mágico volta", () => {
  it("usa o que foi configurado explicitamente", () => {
    expect(origemDoSite({ NEXT_PUBLIC_SITE_URL: "https://segreport.com.br" })).toBe(
      "https://segreport.com.br"
    );
  });

  it("tira a barra do fim — o caminho é colado depois", () => {
    // Sem isto o link sai com // no meio, e o Supabase compara o endereço
    // caractere a caractere com a lista de Redirect URLs.
    expect(origemDoSite({ NEXT_PUBLIC_SITE_URL: "https://segreport.com.br/" })).toBe(
      "https://segreport.com.br"
    );
  });

  it("cai para o domínio de produção da Vercel quando ninguém configurou", () => {
    // A Vercel expõe isso sozinha. Esquecer de definir a variável deixaria o
    // link apontando para a máquina de quem clicou.
    expect(origemDoSite({ VERCEL_PROJECT_PRODUCTION_URL: "segreport.vercel.app" })).toBe(
      "https://segreport.vercel.app"
    );
  });

  it("o explícito ganha do automático", () => {
    expect(
      origemDoSite({
        NEXT_PUBLIC_SITE_URL: "https://segreport.com.br",
        VERCEL_PROJECT_PRODUCTION_URL: "segreport.vercel.app",
      })
    ).toBe("https://segreport.com.br");
  });

  it("em desenvolvimento, localhost", () => {
    expect(origemDoSite({})).toBe("http://localhost:3000");
  });

  it("RECUSA localhost quando está rodando na Vercel", () => {
    // Este é o acidente que a função existe para impedir: variável esquecida
    // em produção faz o e-mail chegar com um link para a máquina de quem
    // clicou. Falhar aqui é diagnosticável; mandar o link não é.
    expect(() => origemDoSite({ VERCEL: "1" })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("não recusa quando a Vercel deu o domínio", () => {
    expect(() =>
      origemDoSite({ VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })
    ).not.toThrow();
  });
});
