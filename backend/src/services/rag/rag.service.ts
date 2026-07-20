import type { Conflict, RetrievedChunk } from "../../types/analysis.js";
import { embedQuery } from "./embedding.service.js";
import { queryByEmbedding } from "./vector.service.js";

const RESULTS_PER_CONFLICT = 2;

export interface RetrievedContext {
  conflict: Conflict;
  chunks: RetrievedChunk[];
}

function buildQuery(conflict: Conflict): string {
  return `Interação medicamentosa entre ${conflict.medicamento_1} e ${conflict.medicamento_2}: ${conflict.efeito}`;
}

async function retrieveForConflict(conflict: Conflict): Promise<RetrievedContext> {
  const embedding = await embedQuery(buildQuery(conflict));
  if (embedding.length === 0) {
    return { conflict, chunks: [] };
  }

  const results = await queryByEmbedding(embedding, RESULTS_PER_CONFLICT);
  const chunks: RetrievedChunk[] = results.map((r) => ({
    id: r.id,
    texto: r.texto,
    metadata: r.metadata,
    distancia: r.distancia ?? undefined,
  }));

  return { conflict, chunks };
}

/** Busca semântica no Chroma: um conjunto de trechos relevantes por conflito determinístico. */
export async function retrieveContextForConflicts(conflicts: Conflict[]): Promise<RetrievedContext[]> {
  return Promise.all(conflicts.map(retrieveForConflict));
}
