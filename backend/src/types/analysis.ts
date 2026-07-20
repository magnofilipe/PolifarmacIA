import type { Interaction } from "./interaction.js";
import type { PatientProfile } from "./patient.js";

/** Justificativa clínica gerada pelo Gemini a partir dos trechos recuperados via RAG. */
export interface RagJustification {
  gravidade: string;
  mecanismo: string;
  conduta: string;
  texto: string;
}

/** Conflito determinístico (motor de regras), enriquecido opcionalmente pelo RAG. */
export interface Conflict extends Interaction {
  par: string;
  justificativa?: RagJustification;
  /** Presente apenas quando o enriquecimento por IA falhou ou não encontrou contexto. */
  rag_indisponivel?: boolean;
}

export interface AnalysisRequest {
  substances: string[];
  patient?: PatientProfile;
}

export interface AnalysisResponse {
  conflicts: Conflict[];
}

export interface RetrievedChunk {
  id: string;
  texto: string;
  metadata: Record<string, unknown>;
  distancia?: number | undefined;
}
