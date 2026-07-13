import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pill } from "lucide-react";
import illustration from "@/assets/auth-illustration.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/patients", replace: true });
    });
  }, [navigate]);

  function translateError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes("password") && (m.includes("weak") || m.includes("easy to guess") || m.includes("pwned") || m.includes("compromised"))) {
      return "Esta senha é conhecida por ser fraca e fácil de adivinhar. Escolha outra.";
    }
    if (m.includes("user already registered") || m.includes("already been registered")) {
      return "Este e-mail já está cadastrado.";
    }
    if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
      return "E-mail ou senha inválidos.";
    }
    if (m.includes("email not confirmed")) return "E-mail ainda não confirmado.";
    if (m.includes("password should be at least")) {
      const match = msg.match(/(\d+)/);
      return `A senha deve ter pelo menos ${match ? match[1] : 6} caracteres.`;
    }
    if (m.includes("unable to validate email") || m.includes("invalid email")) {
      return "E-mail inválido.";
    }
    if (m.includes("rate limit") || m.includes("too many requests")) {
      return "Muitas tentativas. Tente novamente em instantes.";
    }
    if (m.includes("network")) return "Falha de conexão. Verifique sua internet.";
    return "Não foi possível concluir. Tente novamente.";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/patients", replace: true });
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: form on light background */}
      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elegant">
              <Pill className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-tight">
                Polifarmác<span className="text-primary">IA</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Suporte clínico a polifarmácia
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Acesse o painel para gerenciar pacientes e alertas."
              : "Cadastre-se para começar a monitorar interações."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@clinica.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setError(null); setMode(mode === "login" ? "signup" : "login"); }}
            className="mt-6 w-full text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </button>
        </div>
      </section>

      {/* Right: blue panel with illustration */}
      <section className="relative hidden items-center justify-center overflow-hidden bg-primary lg:flex">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px 400px at 20% 10%, color-mix(in oklab, white 25%, transparent), transparent 60%), radial-gradient(500px 400px at 90% 90%, color-mix(in oklab, white 20%, transparent), transparent 60%)",
          }}
        />
        <div className="relative z-10 flex max-w-md flex-col items-center px-8 text-center text-primary-foreground">
          <img
            src={illustration}
            alt="Ilustração médica"
            width={520}
            height={520}
            className="w-full max-w-md drop-shadow-xl"
          />
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">
            Prescrições mais seguras
          </h2>
          <p className="mt-2 text-sm/relaxed text-primary-foreground/90">
            Detecte interações medicamentosas em segundos e reduza riscos na
            polifarmácia dos seus pacientes.
          </p>
        </div>
      </section>
    </main>
  );
}
