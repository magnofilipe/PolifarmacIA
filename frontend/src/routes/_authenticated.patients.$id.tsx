import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileDown,
  Save,
  Pill,
  Pencil,
  X,
  CheckCircle2
} from "lucide-react";
import { SubstanceCombobox } from "@/components/SubstanceCombobox";
import { InteractionModal, type Conflict } from "@/components/InteractionModal";

export const Route = createFileRoute("/_authenticated/patients/$id")({
  component: PatientDetail,
});

type Patient = {
  id: string;
  full_name: string;
  birth_date: string | null;
  sex: string | null;
  conditions: string | null;
  notes: string | null;
};

type Medication = {
  id: string;
  substance: string;
  dose: string | null;
  posology: string | null;
  route: string | null;
  started_on: string | null;
};

function calcAge(bd: string | null) {
  if (!bd) return null;
  const d = new Date(bd);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function PatientDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Estados de análise de interação
  const [showModal, setShowModal] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showNoConflictMsg, setShowNoConflictMsg] = useState(false);

  const [newMed, setNewMed] = useState({
    substance: "",
    dose: "",
    posology: "",
    route: "",
    started_on: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/patients/${id}`);
        setPatient(data);
        setMeds(data.medicamentos || []);
      } catch (err: any) {
        setError(err.message);
      }
    })();
  }, [id]);

  async function savePatient() {
    if (!patient) return;
    setSaving(true);
    try {
      await api.put(`/patients/${patient.id}`, {
        full_name: patient.full_name,
        birth_date: patient.birth_date,
        sex: patient.sex,
        conditions: patient.conditions,
        notes: patient.notes,
      });
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addMed(e: React.FormEvent) {
    e.preventDefault();
    if (!newMed.substance.trim()) return;
    if (!patient) return;

    try {
      // 1. Salva o medicamento
      const addedMed = await api.post(`/patients/${patient.id}/medications`, {
        substance: newMed.substance.trim(),
        dose: newMed.dose || null,
        posology: newMed.posology || null,
        route: newMed.route || null,
        started_on: newMed.started_on || null,
      });
      
      const newMedsList = [...meds, addedMed];
      setMeds(newMedsList);
      setNewMed({ substance: "", dose: "", posology: "", route: "", started_on: "" });
      
      // 2. Dispara análise de interação se houver mais de um medicamento
      setShowNoConflictMsg(false);
      const substances = newMedsList.map(m => m.substance);
      
      if (substances.length > 1) {
        const analysisData = await api.post("/analysis", { substances });
        if (analysisData.conflicts && analysisData.conflicts.length > 0) {
          setConflicts(analysisData.conflicts);
          setShowModal(true);
        } else {
          setShowNoConflictMsg(true);
          // Ocultar mensagem de sucesso após alguns segundos
          setTimeout(() => setShowNoConflictMsg(false), 5000);
        }
      }

    } catch (err: any) {
      setError(err.message);
    }
  }

  async function removeMed(mid: string) {
    if (!patient) return;
    try {
      await api.delete(`/patients/${patient.id}/medications/${mid}`);
      setMeds((prev) => prev.filter((m) => m.id !== mid));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deletePatient() {
    if (!patient) return;
    if (!confirm(`Excluir paciente ${patient.full_name}?`)) return;
    try {
      await api.delete(`/patients/${patient.id}`);
      navigate({ to: "/patients" });
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (error && !patient) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 text-sm text-destructive">{error}</main>
    );
  }
  if (!patient) {
    return <main className="mx-auto max-w-4xl px-4 py-8 text-sm text-muted-foreground">Carregando…</main>;
  }

  const age = calcAge(patient.birth_date);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Modal de Interações */}
      <InteractionModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        conflicts={conflicts} 
      />

      <div className="no-print mb-4 flex items-center justify-between">
        <Link to="/patients" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Pacientes
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-all hover:border-primary/40 hover:text-primary"
          >
            <FileDown className="h-4 w-4" /> Imprimir esta página
          </button>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-all hover:border-primary/40 hover:text-primary"
          >
            <Pencil className="h-4 w-4" /> Ver dados deste paciente
          </button>
          <button
            onClick={deletePatient}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-card px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </button>
        </div>
      </div>

      <div className="print-container card-surface p-6">
        <h1 className="text-primary text-2xl font-semibold tracking-tight">{patient.full_name}</h1>
        <p className="text-sm text-muted-foreground">
          {[age !== null ? `${age} anos` : null, patient.sex].filter(Boolean).join(" • ") || "Sem informações demográficas"}
        </p>
      </div>

      {editing && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={() => setEditing(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Dados do paciente</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você pode atualizar as informações abaixo, se necessário.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Fechar"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <input value={patient.full_name} onChange={(e) => setPatient({ ...patient, full_name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Data de nascimento">
                <input type="date" value={patient.birth_date ?? ""} onChange={(e) => setPatient({ ...patient, birth_date: e.target.value || null })} className={inputCls} />
              </Field>
              <Field label="Sexo">
                <select value={patient.sex ?? ""} onChange={(e) => setPatient({ ...patient, sex: e.target.value || null })} className={inputCls}>
                  <option value="">—</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </Field>
              <Field label="Condições clínicas">
                <input value={patient.conditions ?? ""} onChange={(e) => setPatient({ ...patient, conditions: e.target.value || null })} className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Observações">
                  <textarea value={patient.notes ?? ""} onChange={(e) => setPatient({ ...patient, notes: e.target.value || null })} rows={3} className={inputCls} />
                </Field>
              </div>
            </section>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
              >
                Fechar
              </button>
              <button
                onClick={savePatient}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medications */}
      <section className="mt-6 card-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Medicamentos</h2>
          </div>
          
          {showNoConflictMsg && (
            <div className="animate-in fade-in flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Nenhuma interação detectada
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Adicione a substância, dose, posologia e via. Interações são detectadas automaticamente.
        </p>

        {meds.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum medicamento registrado.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {meds.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <div className="font-medium">{m.substance}</div>
                  <div className="text-xs text-muted-foreground">
                    {[m.dose, m.posology, m.route, m.started_on ? `desde ${m.started_on}` : null]
                      .filter(Boolean)
                      .join(" • ") || "—"}
                  </div>
                </div>
                <button
                  onClick={() => removeMed(m.id)}
                  className="no-print rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addMed} className="no-print mt-6 grid gap-3 sm:grid-cols-2">
          <Field label="Substância" required>
            <SubstanceCombobox
              value={newMed.substance}
              onChange={(v) => setNewMed({ ...newMed, substance: v })}
              required
              placeholder="Selecione uma substância"
            />
          </Field>

          <Field label="Dose">
            <input value={newMed.dose} onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })} className={inputCls} placeholder="Ex.: 5 mg" />
          </Field>
          <Field label="Posologia">
            <input value={newMed.posology} onChange={(e) => setNewMed({ ...newMed, posology: e.target.value })} className={inputCls} placeholder="Ex.: 1x ao dia" />
          </Field>
          <Field label="Via">
            <input value={newMed.route} onChange={(e) => setNewMed({ ...newMed, route: e.target.value })} className={inputCls} placeholder="Ex.: VO" />
          </Field>
          <Field label="Início">
            <input type="date" value={newMed.started_on} onChange={(e) => setNewMed({ ...newMed, started_on: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:opacity-90">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </main>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
