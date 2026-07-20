export interface SubstancePair {
  a: string;
  b: string;
}

/** Gera todas as combinações 2 a 2 (sem repetição, sem considerar ordem) de uma lista de substâncias. */
export function generatePairs(substances: string[]): SubstancePair[] {
  const pairs: SubstancePair[] = [];
  for (let i = 0; i < substances.length; i++) {
    for (let j = i + 1; j < substances.length; j++) {
      const a = substances[i];
      const b = substances[j];
      if (a === undefined || b === undefined) continue;
      pairs.push({ a, b });
    }
  }
  return pairs;
}
