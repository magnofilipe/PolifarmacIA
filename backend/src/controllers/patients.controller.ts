import { type Request, type Response } from "express";
import { getDb, saveDb } from "../utils/db.js";

// Middleware manual/helper para validar o header
function getDoctorId(req: Request): string | null {
  return req.headers["x-doctor-id"] as string || null;
}

export const listPatients = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req);
    if (!doctorId) {
      res.status(401).json({ error: "Sessão inválida. Faça login." });
      return;
    }

    const db = getDb();
    const medico = db.medicos.find((m: any) => m.id === doctorId);
    
    if (!medico) {
      res.status(401).json({ error: "Médico não encontrado." });
      return;
    }

    res.status(200).json(medico.pacientes);
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const getPatient = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req);
    if (!doctorId) return;

    const { id } = req.params;
    const db = getDb();
    const medico = db.medicos.find((m: any) => m.id === doctorId);
    if (!medico) return;

    const patient = medico.pacientes.find((p: any) => p.id === id);
    if (!patient) {
      res.status(404).json({ error: "Paciente não encontrado." });
      return;
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const createPatient = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req);
    if (!doctorId) {
      res.status(401).json({ error: "Sessão inválida." });
      return;
    }

    const { full_name, birth_date, sex, conditions, notes } = req.body;
    if (!full_name) {
      res.status(400).json({ error: "Nome completo é obrigatório." });
      return;
    }

    const db = getDb();
    const medico = db.medicos.find((m: any) => m.id === doctorId);
    if (!medico) {
      res.status(401).json({ error: "Médico não encontrado." });
      return;
    }

    const newPatient = {
      id: crypto.randomUUID(),
      full_name,
      birth_date,
      sex,
      conditions,
      notes,
      updated_at: new Date().toISOString(),
      medicamentos: [],
    };

    medico.pacientes.push(newPatient);
    saveDb(db);

    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req);
    if (!doctorId) return;

    const { id } = req.params;
    const { full_name, birth_date, sex, conditions, notes } = req.body;
    
    const db = getDb();
    const medico = db.medicos.find((m: any) => m.id === doctorId);
    if (!medico) return;

    const patientIndex = medico.pacientes.findIndex((p: any) => p.id === id);
    if (patientIndex === -1) {
      res.status(404).json({ error: "Paciente não encontrado." });
      return;
    }

    medico.pacientes[patientIndex] = {
      ...medico.pacientes[patientIndex],
      full_name: full_name ?? medico.pacientes[patientIndex].full_name,
      birth_date: birth_date ?? medico.pacientes[patientIndex].birth_date,
      sex: sex ?? medico.pacientes[patientIndex].sex,
      conditions: conditions ?? medico.pacientes[patientIndex].conditions,
      notes: notes ?? medico.pacientes[patientIndex].notes,
      updated_at: new Date().toISOString(),
    };

    saveDb(db);
    res.status(200).json(medico.pacientes[patientIndex]);
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req);
    if (!doctorId) return;

    const { id } = req.params;
    const db = getDb();
    const medico = db.medicos.find((m: any) => m.id === doctorId);
    if (!medico) return;

    const patientIndex = medico.pacientes.findIndex((p: any) => p.id === id);
    if (patientIndex === -1) {
      res.status(404).json({ error: "Paciente não encontrado." });
      return;
    }

    medico.pacientes.splice(patientIndex, 1);
    saveDb(db);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const addMedication = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req);
    if (!doctorId) return;

    const { id } = req.params;
    const { substance, dose, posology, route, started_on } = req.body;

    if (!substance) {
      res.status(400).json({ error: "Substância é obrigatória." });
      return;
    }

    const db = getDb();
    const medico = db.medicos.find((m: any) => m.id === doctorId);
    if (!medico) return;

    const patient = medico.pacientes.find((p: any) => p.id === id);
    if (!patient) {
      res.status(404).json({ error: "Paciente não encontrado." });
      return;
    }

    const newMed = {
      id: crypto.randomUUID(),
      substance,
      dose,
      posology,
      route,
      started_on,
    };

    if (!patient.medicamentos) {
      patient.medicamentos = [];
    }
    patient.medicamentos.push(newMed);
    patient.updated_at = new Date().toISOString();
    saveDb(db);

    res.status(201).json(newMed);
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const removeMedication = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req);
    if (!doctorId) return;

    const { id, medId } = req.params;

    const db = getDb();
    const medico = db.medicos.find((m: any) => m.id === doctorId);
    if (!medico) return;

    const patient = medico.pacientes.find((p: any) => p.id === id);
    if (!patient) {
      res.status(404).json({ error: "Paciente não encontrado." });
      return;
    }

    if (!patient.medicamentos) {
      res.status(404).json({ error: "Medicamento não encontrado." });
      return;
    }

    const medIndex = patient.medicamentos.findIndex((m: any) => m.id === medId);
    if (medIndex === -1) {
      res.status(404).json({ error: "Medicamento não encontrado." });
      return;
    }

    patient.medicamentos.splice(medIndex, 1);
    patient.updated_at = new Date().toISOString();
    saveDb(db);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};
