import { type Request, type Response } from "express";
import { getDb, saveDb } from "../utils/db.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email e senha são obrigatórios." });
      return;
    }

    const db = getDb();
    const medico = db.medicos.find((m: any) => m.email === email && m.senha === password);

    if (!medico) {
      res.status(401).json({ error: "Credenciais inválidas." });
      return;
    }

    res.status(200).json({ id: medico.id, nome: medico.nome, email: medico.email });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, nome } = req.body;
    if (!email || !password || !nome) {
      res.status(400).json({ error: "Email, senha e nome são obrigatórios." });
      return;
    }

    const db = getDb();
    const exists = db.medicos.find((m: any) => m.email === email);

    if (exists) {
      res.status(400).json({ error: "Este email já está cadastrado." });
      return;
    }

    const newMedico = {
      id: crypto.randomUUID(),
      nome,
      email,
      senha: password,
      pacientes: [],
    };

    db.medicos.push(newMedico);
    saveDb(db);

    res.status(201).json({ id: newMedico.id, nome: newMedico.nome, email: newMedico.email });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};
