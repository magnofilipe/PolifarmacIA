import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { chunkText } from "../src/utils/chunker.js";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const RAG_JSONL_PATH = path.join(PROJECT_ROOT, "interacoes_rag.jsonl");
// Pasta opcional para PDFs adicionais (ex.: Critérios de Beers, bulas, protocolos geriátricos).
// Ainda não existe no repo — crie-a e coloque os PDFs lá quando quiser expandir a base do RAG.
const REFERENCE_DOCS_DIR = path.join(PROJECT_ROOT, "materiais-referencia");
const OUTPUT_PATH = path.resolve(process.cwd(), "data", "rag-chunks.json");

export interface SourceChunk {
  id: string;
  texto: string;
  metadata: Record<string, string | number | boolean>;
}

interface RagJsonlLine {
  id: string;
  titulo?: string;
  texto: string;
  metadata?: Record<string, string | number | boolean>;
}

function loadInteracoesRagJsonl(): SourceChunk[] {
  if (!fs.existsSync(RAG_JSONL_PATH)) {
    console.warn(`Aviso: ${RAG_JSONL_PATH} não encontrado, pulando.`);
    return [];
  }

  const lines = fs
    .readFileSync(RAG_JSONL_PATH, "utf-8")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  return lines.map((line) => {
    const parsed = JSON.parse(line) as RagJsonlLine;
    return {
      id: parsed.id,
      texto: parsed.texto,
      metadata: {
        ...(parsed.metadata ?? {}),
        titulo: parsed.titulo ?? "",
      },
    };
  });
}

function chunksFromText(rawText: string, fileName: string): SourceChunk[] {
  const chunks = chunkText(rawText, { size: 1000, overlap: 150 });
  return chunks.map((texto, index) => ({
    id: `${fileName}-chunk-${index}`,
    texto,
    metadata: {
      tipo: "documento_referencia",
      fonte: fileName,
      chunk_index: index,
    },
  }));
}

async function extractPdfChunks(filePath: string): Promise<SourceChunk[]> {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return chunksFromText(result.text, path.basename(filePath));
}

/** Extrai texto legível de um HTML sem dependências externas (remove scripts/estilos/tags). */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#?[a-z0-9]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function extractTextFileChunks(filePath: string): SourceChunk[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();
  const text = ext === ".html" || ext === ".htm" ? htmlToText(raw) : raw;
  return chunksFromText(text, path.basename(filePath));
}

const SUPPORTED_EXTENSIONS = [".pdf", ".html", ".htm", ".txt", ".md"];

async function loadReferenceDocsChunks(): Promise<SourceChunk[]> {
  if (!fs.existsSync(REFERENCE_DOCS_DIR)) {
    console.log(`Nenhuma pasta de materiais de referência em ${REFERENCE_DOCS_DIR} — pulando extração de PDFs.`);
    return [];
  }

  const files = fs
    .readdirSync(REFERENCE_DOCS_DIR)
    .filter((f) => SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase()));
  if (files.length === 0) {
    console.log(`Nenhum documento suportado (${SUPPORTED_EXTENSIONS.join(", ")}) em ${REFERENCE_DOCS_DIR}.`);
    return [];
  }

  const allChunks: SourceChunk[] = [];
  for (const file of files) {
    console.log(`Processando ${file}...`);
    try {
      const filePath = path.join(REFERENCE_DOCS_DIR, file);
      const chunks = path.extname(file).toLowerCase() === ".pdf"
        ? await extractPdfChunks(filePath)
        : extractTextFileChunks(filePath);
      allChunks.push(...chunks);
      console.log(`  -> ${chunks.length} chunk(s) extraído(s).`);
    } catch (error) {
      console.warn(`  ! Falha ao processar ${file}, pulando.`, error instanceof Error ? error.message : error);
    }
  }
  return allChunks;
}

async function main() {
  const interacoesChunks = loadInteracoesRagJsonl();
  console.log(`Carregados ${interacoesChunks.length} chunk(s) de ${RAG_JSONL_PATH}.`);

  const referenceChunks = await loadReferenceDocsChunks();

  const allChunks = [...interacoesChunks, ...referenceChunks];

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allChunks, null, 2), "utf-8");

  console.log(`\n${allChunks.length} chunk(s) no total escritos em ${OUTPUT_PATH}.`);
  console.log("Rode 'npm run generate-embeddings' em seguida para gerar e persistir os embeddings no Chroma.");
}

main().catch((error) => {
  console.error("Erro ao processar os documentos de referência.", error);
  process.exit(1);
});
