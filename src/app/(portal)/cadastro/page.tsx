import type { Metadata } from "next";
import AuthForm from "@/components/portal/AuthForm";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return <AuthForm mode="signup" />;
}
