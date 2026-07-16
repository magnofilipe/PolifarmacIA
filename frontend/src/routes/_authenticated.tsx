import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const { doctor, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !doctor) {
      navigate({ to: "/auth", replace: true });
    }
  }, [isLoading, doctor, navigate]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Carregando…
        </div>
      </>
    );
  }

  if (!doctor) return null;

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
