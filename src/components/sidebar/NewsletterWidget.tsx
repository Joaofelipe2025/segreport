"use client";
import { useActionState } from "react";
import { subscribeNewsletterAction } from "@/app/(app)/actions/newsletter";

export default function NewsletterWidget() {
  const [state, formAction, pending] = useActionState(subscribeNewsletterAction, null);

  return (
    <section
      aria-label="Newsletter semanal"
      style={{ borderRadius: 16, background: "var(--ink)", padding: 24 }}
    >
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--green-2)" }}>
        Newsletter semanal
      </p>
      <h2 style={{ marginTop: 8, fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
        O mercado em 5 minutos
      </h2>
      <p style={{ marginTop: 8, fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>
        Um resumo direto ao ponto das principais notícias do setor segurador, toda sexta-feira.
      </p>

      {state?.ok ? (
        <p style={{ marginTop: 16, fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "var(--green-2)", fontWeight: 600 }}>
          ✓ {state.message}
        </p>
      ) : (
        <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <input type="hidden" name="source" value="sidebar" />
          <label htmlFor="newsletter-email" className="sr-only">E-mail</label>
          <input
            id="newsletter-email" name="email" type="email" required placeholder="seu@email.com"
            className="focus:outline-none focus:!border-[var(--green-2)]"
            style={{ borderRadius: 999, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.05)", padding: "8px 16px", fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "#fff" }}
          />
          {state?.message && (
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#F87171" }}>{state.message}</p>
          )}
          <button
            type="submit" disabled={pending}
            className="hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ borderRadius: 999, background: "var(--green)", padding: "8px 16px", fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600, color: "#fff" }}
          >
            {pending ? "Assinando…" : "Assinar grátis"}
          </button>
        </form>
      )}
    </section>
  );
}
