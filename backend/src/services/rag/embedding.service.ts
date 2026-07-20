import { gemini } from "../../config/gemini.js";
import { withRetry } from "../../utils/retry.js";

const EMBEDDING_MODEL = "gemini-embedding-001";
// O free tier conta 1 requisição por texto; enviamos em lotes pequenos.
const BATCH_SIZE = 20;

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

async function embedBatch(texts: string[], taskType: TaskType): Promise<number[][]> {
  const response = await withRetry(
    () =>
      gemini.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: { taskType },
      }),
    { label: "embed" },
  );
  return (response.embeddings ?? []).map((embedding) => embedding.values ?? []);
}

async function embedTexts(texts: string[], taskType: TaskType): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: number[][] = [];
  for (let offset = 0; offset < texts.length; offset += BATCH_SIZE) {
    const batch = texts.slice(offset, offset + BATCH_SIZE);
    const embeddings = await embedBatch(batch, taskType);
    results.push(...embeddings);
  }

  return results;
}

/** Embeda documentos para indexação (ingestão no vetor store). */
export function embedDocuments(texts: string[]): Promise<number[][]> {
  return embedTexts(texts, "RETRIEVAL_DOCUMENT");
}

/** Embeda uma única query de busca. */
export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text], "RETRIEVAL_QUERY");
  return embedding ?? [];
}
