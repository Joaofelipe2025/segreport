import Link from "next/link";

/**
 * Formulários de acesso.
 *
 * Renderizam a interface completa mas ainda não submetem: a autenticação
 * entra com o Supabase Auth na próxima etapa. O aviso abaixo do formulário
 * diz isso explicitamente, para ninguém achar que criou conta de verdade.
 */
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";

  return (
    <div className="mx-auto flex max-w-[1400px] justify-center px-4 py-14 lg:px-8 lg:py-20">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-hairline bg-white p-8">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink">
            {isLogin ? "Entrar no SegReport" : "Criar sua conta"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-3">
            {isLogin
              ? "Acesse o Hub Inteligência e suas preferências."
              : "Conta gratuita: notícias completas, newsletter diária e os indicadores abertos dos seis ramos."}
          </p>

          <form className="mt-7 space-y-4">
            {!isLogin && (
              <Field id="nome" label="Nome completo" type="text" autoComplete="name" />
            )}
            <Field id="email" label="E-mail profissional" type="email" autoComplete="email" />
            <Field
              id="senha"
              label="Senha"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            <button
              type="button"
              className="w-full rounded-lg bg-forest-800 py-3.5 text-xs font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-forest-700"
            >
              {isLogin ? "Entrar" : "Criar conta grátis"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-3">
            {isLogin ? (
              <>
                Ainda não tem conta?{" "}
                <Link href="/cadastro" className="font-semibold text-forest-700 hover:underline">
                  Cadastre-se
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <Link href="/login" className="font-semibold text-forest-700 hover:underline">
                  Entrar
                </Link>
              </>
            )}
          </p>
        </div>

        <p className="mt-5 rounded-lg border border-dashed border-hairline bg-white/60 px-4 py-3 text-center text-xs leading-relaxed text-ink-3">
          A autenticação ainda não está ligada neste preview. O formulário
          mostra a interface final; o login com Supabase entra na próxima etapa.
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-2">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-4 focus:border-forest-500 focus:bg-white"
      />
    </div>
  );
}
