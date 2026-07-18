import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, User, ChevronRight, HelpCircle, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/patients/")({
  component: PatientsList,
});

type Patient = {
  id: string;
  full_name: string;
  birth_date: string | null;
  sex: string | null;
  conditions: string | null;
  updated_at: string;
};

function calcAge(bd: string | null) {
  if (!bd) return null;
  const d = new Date(bd);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

const steps = [
  {
    title: "Cadastro do paciente e medicamentos",
    description:
      "Você, médico, cadastra pacientes e seleciona seus respectivos medicamentos, incluindo a substância, dose, posologia e via.",
  },
  {
    title: "Cruzamento automático",
    description:
      "O sistema verifica os medicamentos selecionados e detecta interações automaticamente.",
  },
  {
    title: "Busca em documentos clínicos",
    description:
      "Quando uma interação é encontrada, o sistema consulta uma base de conhecimento construída a partir de documentos médicos confiáveis, como bulas e protocolos.",
  },
  {
    title: "Geração da justificativa",
    description:
      "Uma inteligência artificial monta uma explicação clara e uma recomendação de manejo, sempre baseada nos documentos consultados e adaptada ao perfil do paciente.",
  },
  {
    title: "Alerta visual na tela",
    description:
      "O alerta aparece com uma cor que indica a gravidade: vermelho para contraindicada, laranja para grave, amarelo para monitoramento e azul para interação menor.",
  },
];

function PatientsList() {
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    api.get("/patients")
      .then((data) => {
        setPatients(data as Patient[]);
      })
      .catch((error) => {
        setError(error.message);
      });
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-base text-muted-foreground">
            Selecione um paciente para gerenciar medicamentos e ver alertas de interações.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <Link
              to="/patients/new"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" /> Novo paciente
            </Link>
            <button
              onClick={() => setShowInfo(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-yellow)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-yellow-foreground)] shadow-sm transition-all hover:brightness-105 hover:shadow-md"
            >
              <HelpCircle className="h-5 w-5" />
              Como interações são detectadas?
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {patients === null ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : patients.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <User className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">Nenhum paciente cadastrado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione seu primeiro paciente para começar.
          </p>
          <Link
            to="/patients/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Adicionar paciente
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => {
            const age = calcAge(p.birth_date);
            return (
              <Link
                key={p.id}
                to="/patients/$id"
                params={{ id: p.id }}
                className="card-surface card-hover group flex items-center gap-3 p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[age !== null ? `${age} anos` : null, p.sex, p.conditions]
                      .filter(Boolean)
                      .join(" • ") || "Sem informações adicionais"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      )}

      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-yellow)] text-[var(--accent-yellow-foreground)]">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Como interações são detectadas?</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                aria-label="Fechar"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              O PolifarmácIA combina uma base de conhecimento médico validada com inteligência artificial para encontrar e explicar interações entre medicamentos de forma simples e segura.
            </p>

            <ol className="mt-6 space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfo(false)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
