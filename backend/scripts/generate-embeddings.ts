import fs from "fs";
import path from "path";
import { embedDocuments } from "../src/services/rag/embedding.service.js";
import { upsertChunks, countChunks, getExistingIds } from "../src/services/rag/vector.service.js";
import type { SourceChunk } from "./process-pdfs.js";

const INPUT_PATH = path.resolve(process.cwd(), "data", "rag-chunks.json");
const EMBED_BATCH_SIZE = 50;

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Arquivo ${INPUT_PATH} não encontrado. Rode 'npm run process-pdfs' primeiro.`);
    process.exit(1);
  }

  const allChunks = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8")) as SourceChunk[];
  if (allChunks.length === 0) {
    console.log("Nenhum chunk para processar.");
    return;
  }

  // Retomada: pula chunks que já estão no Chroma (não gasta quota reprocessando).
  const existing = await getExistingIds(allChunks.map((c) => c.id));
  const chunks = allChunks.filter((c) => !existing.has(c.id));

  if (existing.size > 0) {
    console.log(`${existing.size} chunk(s) já estavam no Chroma — retomando os ${chunks.length} restante(s).`);
  }
  if (chunks.length === 0) {
    console.log("Todos os chunks já foram embedados. Nada a fazer.");
    const total = await countChunks();
    console.log(`A collection 'clinical-documents' tem ${total} registro(s).`);
    return;
  }

  console.log(`Gerando embeddings para ${chunks.length} chunk(s)...`);

  for (let offset = 0; offset < chunks.length; offset += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(offset, offset + EMBED_BATCH_SIZE);
    const embeddings = await embedDocuments(batch.map((c) => c.texto));

    await upsertChunks(
      batch.map((chunk, i) => ({
        id: chunk.id,
        texto: chunk.texto,
        embedding: embeddings[i] ?? [],
        metadata: chunk.metadata,
      })),
    );

    console.log(`  -> ${Math.min(offset + EMBED_BATCH_SIZE, chunks.length)}/${chunks.length} processado(s).`);
  }

  const total = await countChunks();
  console.log(`\nConcluído. A collection 'clinical-documents' agora tem ${total} registro(s).`);
}

main().catch((error) => {
  console.error("Erro ao gerar embeddings.", error);
  process.exit(1);
});
