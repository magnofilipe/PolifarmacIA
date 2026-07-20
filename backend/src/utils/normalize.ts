import type { PairKey } from "../types/interaction.js";

const DIACRITICS_RANGE = new RegExp("[\\u0300-\\u036f]", "g");

export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(DIACRITICS_RANGE, "")
    .toLowerCase()
    .trim();
}

/** Chave alfabética normalizada do par, independente da ordem de entrada. */
export function buildPairKey(a: string, b: string): PairKey {
  return [normalize(a), normalize(b)].sort().join(" + ");
}

/**
 * Chave "frouxa" para casar o campo `par` devolvido pelo Gemini contra o `par`
 * dos conflitos, tolerando diferenças de acento, caixa e espaçamento.
 */
export function loosePairKey(par: string): string {
  return normalize(par).replace(/\s+/g, " ");
}
