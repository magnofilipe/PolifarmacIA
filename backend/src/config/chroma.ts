import { ChromaClient } from "chromadb";
import { env } from "./env.js";

export const CLINICAL_DOCUMENTS_COLLECTION = "clinical-documents";

// Deriva host/port/ssl a partir da CHROMA_URL (o campo `path` foi deprecado no chromadb v3).
const url = new URL(env.CHROMA_URL);

export const chroma = new ChromaClient({
    host: url.hostname,
    port: url.port ? Number(url.port) : 8000,
    ssl: url.protocol === "https:",
});

export async function getCollection() {
    return chroma.getOrCreateCollection({
        name: CLINICAL_DOCUMENTS_COLLECTION,
        // Nós fornecemos os embeddings (via Gemini) manualmente no upsert/query,
        // então o Chroma não deve tentar instanciar uma embedding function própria.
        embeddingFunction: null,
    });
}
