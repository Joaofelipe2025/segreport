import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato — Segreport",
  description: "Entre em contato com a equipe do Segreport. Pautas, sugestões, parcerias e anúncios.",
};

export default function ContatoPage() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 20px 100px" }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green)", display: "block", marginBottom: 10 }}>
        Fale conosco
      </span>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: 8 }}>
        Contato
      </h1>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, color: "var(--ink-3)", marginBottom: 40, lineHeight: 1.6 }}>
        Pautas editoriais, sugestões de matéria, parcerias comerciais e anúncios. Responderemos em até 1 dia útil.
      </p>

      <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gap: 16 }} className="grid-cols-1 md:grid-cols-2">
          {[
            { id: "nome", label: "Nome completo", type: "text", placeholder: "Seu nome" },
            { id: "email", label: "E-mail profissional", type: "email", placeholder: "voce@empresa.com" },
          ].map((field) => (
            <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor={field.id} style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{field.label}</label>
              <input
                id={field.id}
                name={field.id}
                type={field.type}
                required
                placeholder={field.placeholder}
                style={{ borderRadius: 8, border: "1px solid var(--border)", padding: "10px 14px", fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "var(--ink)", background: "var(--white)", outline: "none" }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="assunto" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Assunto</label>
          <select id="assunto" name="assunto" style={{ borderRadius: 8, border: "1px solid var(--border)", padding: "10px 14px", fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "var(--ink)", background: "var(--white)", outline: "none" }}>
            <option value="">Selecione o assunto</option>
            <option value="pauta">Sugestão de pauta</option>
            <option value="parceria">Parceria comercial</option>
            <option value="anuncio">Anúncio</option>
            <option value="erro">Correção editorial</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="mensagem" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Mensagem</label>
          <textarea
            id="mensagem"
            name="mensagem"
            required
            rows={6}
            placeholder="Descreva sua solicitação..."
            style={{ borderRadius: 8, border: "1px solid var(--border)", padding: "10px 14px", fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "var(--ink)", background: "var(--white)", outline: "none", resize: "vertical" }}
          />
        </div>

        <button
          type="submit"
          style={{ alignSelf: "flex-start", borderRadius: 999, background: "var(--green)", padding: "12px 28px", fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600, color: "#fff" }}
        >
          Enviar mensagem
        </button>
      </form>

      <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--border)", display: "grid", gap: 16 }} className="grid-cols-1 md:grid-cols-2">
        {[
          { label: "E-mail editorial", value: "redacao@segreport.com.br" },
          { label: "Parcerias e anúncios", value: "comercial@segreport.com.br" },
        ].map((item) => (
          <div key={item.label}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-4)", marginBottom: 4 }}>{item.label}</p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "var(--green)", fontWeight: 500 }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
