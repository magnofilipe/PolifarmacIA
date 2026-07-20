import fs from "fs";
import path from "path";
import type { Interaction, InteractionIndex, InteractionIndexFile } from "../../types/interaction.js";
import { buildPairKey } from "../../utils/normalize.js";

const INDEX_PATH = path.resolve(process.cwd(), "..", "indice_pares.json");

function loadIndex(): InteractionIndex {
  try {
    const raw = fs.readFileSync(INDEX_PATH, "utf-8");
    const parsed = JSON.parse(raw) as InteractionIndexFile;
    return parsed.indice ?? {};
  } catch (error) {
    console.error(`Erro ao carregar ${INDEX_PATH}`, error);
    return {};
  }
}

// Carregado uma única vez no boot do processo (lookup O(1) em memória).
let index: InteractionIndex = loadIndex();

export function findByPair(a: string, b: string): Interaction[] {
  const key = buildPairKey(a, b);
  return index[key] ?? [];
}

/** Recarrega o índice do disco. Útil após rodar os scripts de curadoria de dados. */
export function reloadIndex(): void {
  index = loadIndex();
}
