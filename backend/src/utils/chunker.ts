export interface ChunkOptions {
  /** Tamanho alvo do chunk em caracteres. */
  size?: number;
  /** Sobreposição entre chunks consecutivos, em caracteres. */
  overlap?: number;
}

const DEFAULT_SIZE = 800;
const DEFAULT_OVERLAP = 100;

/**
 * Particiona um texto longo em chunks de tamanho aproximado, respeitando
 * fronteiras de parágrafo/frase sempre que possível (não corta no meio de uma palavra).
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const size = options.size ?? DEFAULT_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) return [];
  if (normalized.length <= size) return [normalized];

  const paragraphs = normalized.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= size) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current.trim());
      current = overlapTail(current, overlap);
    }

    if (paragraph.length <= size) {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    } else {
      // Parágrafo maior que o tamanho alvo: quebra por sentença.
      for (const piece of splitLongParagraph(paragraph, size, overlap)) {
        if (current && `${current} ${piece}`.length <= size) {
          current = `${current} ${piece}`;
        } else {
          if (current) chunks.push(current.trim());
          current = piece;
        }
      }
    }
  }

  if (current.trim().length > 0) chunks.push(current.trim());

  return chunks;
}

function overlapTail(text: string, overlap: number): string {
  if (overlap <= 0 || text.length <= overlap) return "";
  return text.slice(text.length - overlap);
}

function splitLongParagraph(paragraph: string, size: number, overlap: number): string[] {
  const sentences = paragraph.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const pieces: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= size) {
      current = candidate;
    } else {
      if (current) pieces.push(current.trim());
      current = overlap > 0 ? `${overlapTail(current, overlap)} ${sentence}`.trim() : sentence;
    }
  }

  if (current.trim().length > 0) pieces.push(current.trim());
  return pieces;
}
