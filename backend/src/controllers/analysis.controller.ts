import { type Request, type Response } from "express";
import fs from "fs";
import path from "path";

// Carrega as interações em memória
const interacoesPath = path.resolve(process.cwd(), "interacoes_medicamentosas.json");
let interacoesDB: any = [];

try {
  const data = fs.readFileSync(interacoesPath, "utf-8");
  const parsed = JSON.parse(data);
  interacoesDB = parsed.interacoes || [];
} catch (error) {
  console.error("Erro ao carregar interacoes_medicamentosas.json", error);
}

// Normalização para comparar nomes
function normalize(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export const getAnalysis = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Rota GET de analise não utilizada, use POST." });
};

export const createAnalysis = async (req: Request, res: Response) => {
  try {
    const { substances } = req.body;
    if (!substances || !Array.isArray(substances)) {
      res.status(400).json({ error: "O array de substâncias é obrigatório." });
      return;
    }

    const conflicts = [];
    
    // Testa todas as combinações 2 a 2
    for (let i = 0; i < substances.length; i++) {
      for (let j = i + 1; j < substances.length; j++) {
        const subA = normalize(substances[i]);
        const subB = normalize(substances[j]);

        // Busca se existe interação para o par (a ordem não importa)
        const match = interacoesDB.find((interacao: any) => {
          const med1 = normalize(interacao.medicamento_1);
          const med2 = normalize(interacao.medicamento_2);
          
          return (med1 === subA && med2 === subB) || (med1 === subB && med2 === subA);
        });

        if (match) {
          conflicts.push(match);
        }
      }
    }

    res.status(200).json({ conflicts });
  } catch (error) {
    console.error("Erro na análise", error);
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
