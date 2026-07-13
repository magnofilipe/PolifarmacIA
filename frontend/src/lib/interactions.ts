export type Severity = "contraindicated" | "serious" | "monitor" | "minor";

export const SEVERITY_META: Record<
  Severity,
  { label: string; description: string; className: string; badgeClass: string }
> = {
  contraindicated: {
    label: "Contraindicada",
    description:
      "Os riscos do uso concomitante desses medicamentos superam os benefícios.",
    className: "border-l-4 border-l-[var(--severity-contra)] bg-[color-mix(in_oklab,var(--severity-contra)_8%,var(--color-card))]",
    badgeClass: "bg-[var(--severity-contra)] text-white",
  },
  serious: {
    label: "Grave — Usar alternativa",
    description:
      "Evitar o uso simultâneo ou considerar terapia alternativa; pode incluir ajuste de dose se a associação for inevitável.",
    className: "border-l-4 border-l-[var(--severity-serious)] bg-[color-mix(in_oklab,var(--severity-serious)_10%,var(--color-card))]",
    badgeClass: "bg-[var(--severity-serious)] text-white",
  },
  monitor: {
    label: "Monitorar de perto",
    description:
      "Monitorar aumento de efeitos, reações adversas ou redução de eficácia.",
    className: "border-l-4 border-l-[var(--severity-monitor)] bg-[color-mix(in_oklab,var(--severity-monitor)_12%,var(--color-card))]",
    badgeClass: "bg-[var(--severity-monitor)] text-black",
  },
  minor: {
    label: "Menor",
    description:
      "A coadministração não causa diferenças clinicamente significativas ou os efeitos são desconhecidos.",
    className: "border-l-4 border-l-[var(--severity-minor)] bg-[color-mix(in_oklab,var(--severity-minor)_8%,var(--color-card))]",
    badgeClass: "bg-[var(--severity-minor)] text-white",
  },
};

export const SEVERITY_ORDER: Severity[] = [
  "contraindicated",
  "serious",
  "monitor",
  "minor",
];

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export interface DrugInteractionRow {
  id: string;
  substance_a: string;
  substance_b: string;
  severity: Severity;
  mechanism: string | null;
  recommendation: string | null;
}

export interface DetectedInteraction extends DrugInteractionRow {
  drugs: [string, string];
}

export function detectInteractions(
  substances: string[],
  knowledge: DrugInteractionRow[],
): DetectedInteraction[] {
  const normalized = substances.map((s) => ({ raw: s, norm: normalize(s) }));
  const found: DetectedInteraction[] = [];
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const a = normalized[i];
      const b = normalized[j];
      const match = knowledge.find(
        (k) =>
          (normalize(k.substance_a) === a.norm && normalize(k.substance_b) === b.norm) ||
          (normalize(k.substance_a) === b.norm && normalize(k.substance_b) === a.norm),
      );
      if (match) {
        found.push({ ...match, drugs: [a.raw, b.raw] });
      }
    }
  }
  return found.sort(
    (x, y) => SEVERITY_ORDER.indexOf(x.severity) - SEVERITY_ORDER.indexOf(y.severity),
  );
}
