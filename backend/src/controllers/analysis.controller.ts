import { type Request, type Response } from "express";
import { checkInteractions } from "../services/interaction/interaction.service.js";
import { enrichConflicts } from "../services/analysis.service.js";

export const getAnalysis = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Rota GET de analise não utilizada, use POST." });
};

// Fase 1 (rápida): apenas o motor de regras determinístico. Responde na hora.
export const createAnalysis = async (req: Request, res: Response) => {
  try {
    const { substances } = req.body;
    if (!substances || !Array.isArray(substances)) {
      res.status(400).json({ error: "O array de substâncias é obrigatório." });
      return;
    }

    const conflicts = checkInteractions(substances);
    res.status(200).json({ conflicts });
  } catch (error) {
    console.error("Erro na análise", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

// Fase 2 (lenta): recebe os conflitos já detectados e devolve a justificativa da IA.
export const justifyAnalysis = async (req: Request, res: Response) => {
  try {
    const { conflicts, patient } = req.body;
    if (!conflicts || !Array.isArray(conflicts)) {
      res.status(400).json({ error: "O array de conflitos é obrigatório." });
      return;
    }

    const enriched = await enrichConflicts(conflicts, patient);
    res.status(200).json({ conflicts: enriched });
  } catch (error) {
    console.error("Erro ao justificar análise", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

// Rotas abaixo são stubs e não serão usadas agora
export const updateAnalysis = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Analysis updated' });
};

export const deleteAnalysis = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Analysis deleted' });
};
