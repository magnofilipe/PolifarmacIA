export type InteractionAction =
  | "Ajustar a dose"
  | "Contraindicado"
  | "Evitar a associação"
  | "Geralmente evitar"
  | "Monitorizar de perto"
  | string;

export interface Interaction {
  id: number;
  medicamento_1: string;
  medicamento_2: string;
  acao: InteractionAction;
  efeito: string;
  recomendacao: string;
}

/** Chave normalizada do par, ex.: "aas + varfarina" (ordem alfabética, sem acento, minúsculo). */
export type PairKey = string;

export type InteractionIndex = Record<PairKey, Interaction[]>;

export interface InteractionIndexFile {
  _instrucoes?: Record<string, string>;
  indice: InteractionIndex;
}
