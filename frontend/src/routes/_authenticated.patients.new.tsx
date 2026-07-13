import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/patients/new")({
  component: NewPatient,
});

function NewPatient() {
  const navigate = useNavigate();
  const [full_name, setName] = useState("");
  const [birth_date, setBirth] = useState("");
  const [sex, setSex] = useState("");
  const [conditions, setConditions] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr || !u.user) {
        console.error("[patients.new] sessão inválida", uErr);
        setError("Sessão expirada. Faça login novamente.");
        navigate({ to: "/auth", replace: true });
        return;
      }
      const { data, error } = await supabase
        .from("patients")
        .insert({
          doctor_id: u.user.id,
          full_name: full_name.trim(),
          birth_date: birth_date || null,
          sex: sex || null,
          conditions: conditions?.trim() || null,
          notes: notes?.trim() || null,
        })
        .select("id")
        .single();
      if (error) {
        console.error("[patients.new] insert error", error);
        setError(error.message);
        return;
      }
      navigate({ to: "/patients/$id", params: { id: data.id } });
    } catch (err) {
      console.error("[patients.new] unexpected", err);
      setError(err instanceof Error ? err.message : "Erro inesperado ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to="/patients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="card-surface p-6">
        <h1 className="text-xl font-semibold">Novo paciente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha apenas dados clínicos necessários. Não insira dados sensíveis.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Nome completo" required>
            <input required value={full_name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data de nascimento">
              <input type="date" value={birth_date} onChange={(e) => setBirth(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Sexo">
              <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputCls}>
                <option value="">—</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </Field>
          </div>
          <Field label="Condições clínicas">
            <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={2} className={inputCls} placeholder="Ex.: HAS, DM2, DPOC" />
          </Field>
          <Field label="Observações">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} />
          </Field>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <button type="submit" disabled={loading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50">
            {loading ? "Salvando…" : "Salvar paciente"}
          </button>
        </form>
      </div>
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
