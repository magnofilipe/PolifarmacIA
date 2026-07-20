import type { Conflict, AnalysisResponse } from "../types/analysis.js";
import type { PatientProfile } from "../types/patient.js";
import { checkInteractions } from "./interaction/interaction.service.js";
import { retrieveContextForConflicts } from "./rag/rag.service.js";
import { generateJustifications } from "./llm/gemini.service.js";
import { loosePairKey } from "../utils/normalize.js";

/**
 * Orquestra a análise: o motor de regras (interaction.service) é sempre a fonte
 * de verdade sobre a existência de conflitos. O RAG + Gemini só entram para
 * enriquecer com uma justificativa clínica — se falharem, a resposta ainda
 * contém o resultado determinístico intacto.
 */
export async function runAnalysis(
  substances: string[],
  patient?: PatientProfile,
): Promise<AnalysisResponse> {
  const conflicts = checkInteractions(substances);

  if (conflicts.length === 0) {
    return { conflicts };
  }

  const enriched = await enrichConflicts(conflicts, patient);
  return { conflicts: enriched };
}

/**
 * Fase 2 (lenta): enriquece conflitos já detectados com a justificativa da IA.
 * Exposta separadamente para o front poder mostrar o alerta determinístico na hora
 * e buscar a explicação da IA em seguida. Nunca lança — degrada para rag_indisponivel.
 */
export async function enrichConflicts(conflicts: Conflict[], patient?: PatientProfile): Promise<Conflict[]> {
  try {
    const contexts = await retrieveContextForConflicts(conflicts);
    const justifications = await generateJustifications(contexts, patient);

    return conflicts.map((conflict) => {
      const justificativa = justifications.get(loosePairKey(conflict.par));
      return justificativa ? { ...conflict, justificativa } : { ...conflict, rag_indisponivel: true };
    });
  } catch (error) {
    console.error("Falha ao enriquecer conflitos via RAG/Gemini — retornando apenas o resultado determinístico.", error);
    return conflicts.map((conflict) => ({ ...conflict, rag_indisponivel: true }));
  }
}
