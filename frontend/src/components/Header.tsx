import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { Pill, LogOut } from "lucide-react";

export function Header() {
  const navigate = useNavigate();
  const { doctor, logout } = useAuth();

  function signOut() {
    logout();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
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
        </Link>
        {doctor ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{doctor.email}</span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-all hover:border-primary/40 hover:text-primary"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
