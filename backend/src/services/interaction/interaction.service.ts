import type { Conflict } from "../../types/analysis.js";
import { generatePairs } from "../../utils/pair-generator.js";
import { normalize } from "../../utils/normalize.js";
import { findByPair } from "./interaction.repository.js";

function buildDisplayPar(medicamento1: string, medicamento2: string): string {
  return [medicamento1, medicamento2]
    .sort((a, b) => normalize(a).localeCompare(normalize(b)))
    .join(" + ");
}

/**
 * Motor de regras: fonte de verdade sobre a existência de interações.
 * Gera todos os pares 2 a 2 das substâncias informadas e consulta o índice O(1).
 */
export function checkInteractions(substances: string[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const { a, b } of generatePairs(substances)) {
    const matches = findByPair(a, b);
    for (const match of matches) {
      conflicts.push({
        ...match,
        par: buildDisplayPar(match.medicamento_1, match.medicamento_2),
      });
    }
  }

  return conflicts;
}
