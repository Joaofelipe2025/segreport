import { describe, expect, it } from "vitest";
import { mensagemDeMotivo, mensagemDeMotivoDoLeitor } from "@/lib/painel/motivos";
import { portaDeEntrada } from "@/lib/painel/porta";

describe("motivos de recusa na porta da redação", () => {
  it("sessão expirada", () => {
    expect(mensagemDeMotivo("sessao")).toBe("Sua sessão expirou. Entre de novo.");
  });

  it("sem acesso ao painel — sem sugerir que a conta não existe", () => {
    expect(mensagemDeMotivo("permissao")).toBe(
      "Esta porta é da redação. Sua conta não tem acesso ao painel."
    );
  });

  it("link vencido e link ilegível são mensagens diferentes", () => {
    expect(mensagemDeMotivo("link-expirado")).toBe("O link venceu. Peça outro abaixo.");
    expect(mensagemDeMotivo("link-invalido")).toBe(
      "O link não pôde ser lido. Peça outro abaixo."
    );
  });

  it("sem motivo devolve nulo — a tela não mostra aviso nenhum", () => {
    expect(mensagemDeMotivo(undefined)).toBeNull();
    expect(mensagemDeMotivo(null)).toBeNull();
    expect(mensagemDeMotivo("")).toBeNull();
  });

  it("motivo desconhecido devolve nulo, não o código cru", () => {
    // A URL é pública e aceita qualquer coisa. Ecoar o valor na tela seria
    // deixar um estranho escrever no nosso aviso.
    expect(mensagemDeMotivo("<script>alert(1)</script>")).toBeNull();
    expect(mensagemDeMotivo("qualquer-coisa")).toBeNull();
    expect(mensagemDeMotivo(42)).toBeNull();
    expect(mensagemDeMotivo(["sessao"])).toBeNull();
  });

  it("não herda propriedade de Object.prototype", () => {
    // Busca em objeto literal responde a 'constructor' e 'toString' com o
    // que veio do protótipo — viraria função no lugar de aviso.
    expect(mensagemDeMotivo("constructor")).toBeNull();
    expect(mensagemDeMotivo("toString")).toBeNull();
    expect(mensagemDeMotivo("__proto__")).toBeNull();
  });
});

describe("porta de entrada no retorno do link", () => {
  it("marcador da redação leva à porta da redação", () => {
    expect(portaDeEntrada("redacao")).toBe("/painel/entrar");
  });

  it("sem marcador, leva à porta do leitor", () => {
    expect(portaDeEntrada(undefined)).toBe("/login");
  });

  it("marcador adulterado leva à porta do leitor, não a um destino arbitrário", () => {
    // O cookie é preferência de navegação, não credencial — mas nem por isso
    // ele escolhe o endereço. A lista é fechada.
    expect(portaDeEntrada("https://exemplo.invalido")).toBe("/login");
    expect(portaDeEntrada("//evil.test")).toBe("/login");
    expect(portaDeEntrada("")).toBe("/login");
  });
});

describe("motivos na porta do leitor", () => {
  it("fala a língua do leitor, sem citar painel", () => {
    expect(mensagemDeMotivoDoLeitor("permissao")).toBe("Sua conta não tem acesso a essa área.");
  });

  it("__proto__ NÃO derruba a página pública", () => {
    // Verificado pelo revisor com renderToStaticMarkup: com objeto literal,
    // MOTIVOS["__proto__"] devolve Object.prototype, que é truthy, e o React
    // lança "Objects are not valid as a React child" — 500 numa rota pública,
    // por URL que qualquer pessoa monta.
    expect(mensagemDeMotivoDoLeitor("__proto__")).toBeNull();
    expect(mensagemDeMotivoDoLeitor("constructor")).toBeNull();
    expect(mensagemDeMotivoDoLeitor("toString")).toBeNull();
    expect(mensagemDeMotivoDoLeitor("valueOf")).toBeNull();
  });

  it("as duas portas conhecem os mesmos códigos", () => {
    // Um código tratado numa porta e ignorado na outra vira aviso que some
    // conforme onde a pessoa cai.
    for (const c of ["sessao", "permissao", "link-expirado", "link-invalido", "perfil-ilegivel"]) {
      expect(mensagemDeMotivo(c), `redação: ${c}`).not.toBeNull();
      expect(mensagemDeMotivoDoLeitor(c), `leitor: ${c}`).not.toBeNull();
    }
  });
});
