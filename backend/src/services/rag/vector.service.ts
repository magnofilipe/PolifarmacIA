import { getCollection } from "../../config/chroma.js";

export interface VectorChunk {
  id: string;
  texto: string;
  embedding: number[];
  metadata: Record<string, string | number | boolean>;
}

export interface VectorQueryResult {
  id: string;
  texto: string;
  metadata: Record<string, unknown>;
  distancia?: number | null | undefined;
}

export async function upsertChunks(chunks: VectorChunk[]): Promise<void> {
  if (chunks.length === 0) return;

  const collection = await getCollection();
  await collection.upsert({
    ids: chunks.map((c) => c.id),
    embeddings: chunks.map((c) => c.embedding),
    documents: chunks.map((c) => c.texto),
    metadatas: chunks.map((c) => c.metadata),
  });
}

export async function queryByEmbedding(
  embedding: number[],
  nResults = 3,
): Promise<VectorQueryResult[]> {
  const collection = await getCollection();
  const result = await collection.query({
    queryEmbeddings: [embedding],
    nResults,
  });

  const [rows] = result.rows();

  return (rows ?? []).map((row) => ({
    id: row.id,
    texto: row.document ?? "",
    metadata: row.metadata ?? {},
    distancia: row.distance,
  }));
}

export async function countChunks(): Promise<number> {
  const collection = await getCollection();
  return collection.count();
}

export async function getExistingIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const collection = await getCollection();
  const found = await collection.get({ ids, include: [] });
  return new Set(found.ids);
}
