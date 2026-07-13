
-- Severity enum
CREATE TYPE public.interaction_severity AS ENUM ('contraindicated','serious','monitor','minor');

-- Patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  birth_date date,
  sex text,
  conditions text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors manage their patients" ON public.patients FOR ALL
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

-- Medications
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  substance text NOT NULL,
  dose text,
  posology text,
  route text,
  started_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors manage their patient meds" ON public.medications FOR ALL
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);
CREATE INDEX medications_patient_idx ON public.medications(patient_id);

-- Drug interactions knowledge base
CREATE TABLE public.drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  substance_a text NOT NULL,
  substance_b text NOT NULL,
  severity public.interaction_severity NOT NULL,
  mechanism text,
  recommendation text
);
GRANT SELECT ON public.drug_interactions TO authenticated, anon;
GRANT ALL ON public.drug_interactions TO service_role;
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interactions are readable by anyone" ON public.drug_interactions FOR SELECT USING (true);
CREATE INDEX drug_interactions_a_idx ON public.drug_interactions(lower(substance_a));
CREATE INDEX drug_interactions_b_idx ON public.drug_interactions(lower(substance_b));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed common, clinically relevant interactions (translated to PT-BR)
INSERT INTO public.drug_interactions (substance_a, substance_b, severity, mechanism, recommendation) VALUES
('varfarina','aspirina','serious','Ambas aumentam o risco de sangramento (anticoagulação + antiagregação).','Evitar associação; se necessária, monitorar INR e sinais de sangramento de perto.'),
('varfarina','amiodarona','serious','Amiodarona inibe o metabolismo da varfarina, elevando o INR.','Reduzir dose da varfarina em ~30–50% e monitorar INR semanalmente.'),
('varfarina','fluconazol','serious','Fluconazol inibe CYP2C9, aumentando o efeito da varfarina.','Evitar; se necessário, ajustar dose e monitorar INR.'),
('varfarina','ibuprofeno','serious','AINE aumenta risco de sangramento gastrointestinal e desloca ligação proteica.','Preferir paracetamol; se AINE for indispensável, considerar protetor gástrico e monitorar.'),
('clopidogrel','omeprazol','monitor','Omeprazol inibe CYP2C19 reduzindo ativação do clopidogrel.','Preferir pantoprazol como alternativa.'),
('sinvastatina','claritromicina','contraindicated','Inibição potente de CYP3A4 aumenta níveis de sinvastatina, com risco de rabdomiólise.','Suspender sinvastatina durante o curso de claritromicina ou trocar por azitromicina.'),
('sinvastatina','amiodarona','serious','Amiodarona aumenta níveis plasmáticos de sinvastatina.','Limitar sinvastatina a 20 mg/dia ou trocar por pravastatina/rosuvastatina.'),
('atorvastatina','claritromicina','serious','Inibição de CYP3A4 aumenta risco de miopatia.','Suspender atorvastatina ou usar antibiótico alternativo.'),
('metformina','contraste iodado','serious','Risco de acidose láctica em pacientes com função renal comprometida.','Suspender metformina antes do exame e reiniciar após 48h com função renal preservada.'),
('espironolactona','enalapril','monitor','Ambos elevam potássio; risco de hipercalemia.','Monitorar potássio sérico e função renal periodicamente.'),
('losartana','espironolactona','monitor','Risco de hipercalemia por ação combinada em SRAA.','Monitorar potássio e função renal.'),
('digoxina','amiodarona','serious','Amiodarona aumenta níveis séricos de digoxina.','Reduzir dose de digoxina em ~50% e monitorar níveis séricos.'),
('digoxina','furosemida','monitor','Hipocalemia induzida por furosemida potencializa toxicidade da digoxina.','Monitorar potássio e sinais de toxicidade digitálica.'),
('tramadol','sertralina','serious','Risco de síndrome serotoninérgica.','Evitar associação; se necessário, monitorar sinais neurológicos.'),
('tramadol','fluoxetina','serious','Risco de síndrome serotoninérgica e redução do limiar convulsivo.','Evitar associação.'),
('sertralina','fluoxetina','contraindicated','Duplicação de ISRS com risco de síndrome serotoninérgica grave.','Contraindicado o uso simultâneo.'),
('sildenafila','nitrato','contraindicated','Vasodilatação sinérgica com risco de hipotensão grave.','Contraindicado o uso concomitante com nitratos.'),
('captopril','ibuprofeno','monitor','AINE reduz efeito anti-hipertensivo e aumenta risco renal.','Monitorar PA e função renal; preferir paracetamol.'),
('lítio','ibuprofeno','serious','AINE reduz clearance renal do lítio, elevando níveis séricos.','Evitar; monitorar litemia se combinação for necessária.'),
('lítio','hidroclorotiazida','serious','Tiazídico reduz excreção renal de lítio.','Ajustar dose e monitorar litemia.'),
('alprazolam','codeína','serious','Depressão do SNC e respiratória potencializada.','Evitar; se necessário, doses mínimas e monitoração.'),
('diazepam','morfina','serious','Depressão respiratória combinada.','Evitar associação em idosos; monitorar rigorosamente.'),
('ciprofloxacino','tizanidina','contraindicated','Inibição de CYP1A2 aumenta drasticamente tizanidina, causando hipotensão e sedação.','Contraindicado.'),
('metotrexato','trimetoprima','serious','Aumento da toxicidade hematológica do metotrexato.','Evitar; monitorar hemograma se inevitável.'),
('fenitoina','fluconazol','serious','Fluconazol eleva níveis de fenitoína.','Monitorar níveis e ajustar dose.'),
('paracetamol','varfarina','monitor','Uso crônico de paracetamol pode elevar INR.','Monitorar INR em uso prolongado.'),
('amoxicilina','metotrexato','monitor','Redução da excreção renal do metotrexato.','Monitorar toxicidade em uso prolongado.'),
('carbamazepina','fluoxetina','monitor','Fluoxetina eleva níveis de carbamazepina.','Monitorar níveis séricos.'),
('propranolol','verapamil','serious','Bradicardia e bloqueio AV por depressão sinérgica.','Evitar; monitorar FC e ECG.');
