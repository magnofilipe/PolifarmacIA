import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Pill } from "lucide-react";
import illustration from "@/assets/auth-illustration.svg";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { doctor, setDoctor, isLoading } = useAuth();
  
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && doctor) {
      navigate({ to: "/patients", replace: true });
    }
  }, [isLoading, doctor, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        // Usa a parte do email antes do @ como nome provisório
        const nome = email.split("@")[0];
        const user = await api.post("/auth/signup", { email, password, nome });
        setDoctor(user);
      } else {
        const user = await api.post("/auth/login", { email, password });
        setDoctor(user);
      }
      navigate({ to: "/patients", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return null;

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
