"use client";
import { useActionState } from "react";
import { subscribeNewsletterAction } from "@/app/(app)/actions/newsletter";

export default function FooterNewsletter() {
  const [state, formAction, pending] = useActionState(subscribeNewsletterAction, null);

  if (state?.ok) {
    return (
      <p className="font-sans text-sm text-[#12956A]">
        ✓ {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="source" value="footer" />
      <label htmlFor="footer-newsletter-email" className="sr-only">E-mail</label>
      <input
        id="footer-newsletter-email" name="email" type="email" required
        placeholder="seu@email.com"
        className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-sans text-sm text-white placeholder:text-white/40 focus:border-[#12956A] focus:outline-none"
      />
      <button
        type="submit" disabled={pending}
        className="rounded-full bg-[#0D6E4F] px-4 py-2 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "…" : "Assinar"}
      </button>
      {state?.message && !state.ok && (
        <p className="w-full font-sans text-xs text-red-400">{state.message}</p>
      )}
    </form>
  );
}
