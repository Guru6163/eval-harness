import type { Comparison, DocType, Document } from "@/lib/api";
import { FIELD_LABELS, type ScoredField } from "@/lib/fields";

/** Field row order for the comparison table. */
export const COMPARISON_FIELD_ORDER: ScoredField[] = [
  "vendor_name",
  "line_items",
  "total_amount",
  "currency",
  "lead_time_days",
  "payment_terms",
  "validity_date",
];

export function formatAccuracyPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

export type DeltaVariant = "up" | "down" | "none";

export function formatDelta(delta: number | null): {
  text: string;
  variant: DeltaVariant;
} {
  if (delta === null) return { text: "—", variant: "none" };
  const pct = Math.round(delta * 100);
  if (pct === 0) return { text: "—", variant: "none" };
  if (pct > 0) return { text: `+${pct}%`, variant: "up" };
  return { text: `${pct}%`, variant: "down" };
}

export function fieldLabel(fieldName: string): string {
  if (fieldName in FIELD_LABELS) {
    return FIELD_LABELS[fieldName as ScoredField];
  }
  return fieldName.replace(/_/g, " ");
}

export interface ComparisonChartRow {
  label: string;
  promptA: number;
  promptB: number;
  hasA: boolean;
  hasB: boolean;
}

const DOC_TYPE_GROUPS: { key: DocType | "overall"; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "supplier_quote", label: "Supplier quote" },
  { key: "customer_request", label: "Customer request" },
  { key: "purchase_order", label: "Purchase order" },
];

export function buildComparisonChartData(
  comparison: Comparison,
  documents: Document[]
): ComparisonChartRow[] {
  const docTypeById = new Map(documents.map((d) => [d.id, d.doc_type]));

  return DOC_TYPE_GROUPS.map(({ key, label }) => {
    if (key === "overall") {
      return {
        label,
        promptA: comparison.overall_accuracy_a ?? 0,
        promptB: comparison.overall_accuracy_b ?? 0,
        hasA: comparison.overall_accuracy_a !== null,
        hasB: comparison.overall_accuracy_b !== null,
      };
    }

    const rows = comparison.documents.filter(
      (d) => docTypeById.get(d.document_id) === key
    );
    const scoresA = rows
      .map((d) => d.score_a)
      .filter((s): s is number => s !== null);
    const scoresB = rows
      .map((d) => d.score_b)
      .filter((s): s is number => s !== null);

    const avg = (scores: number[]) =>
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

    const a = avg(scoresA);
    const b = avg(scoresB);

    return {
      label,
      promptA: a ?? 0,
      promptB: b ?? 0,
      hasA: a !== null,
      hasB: b !== null,
    };
  });
}

export function chartPercent(value: number, hasData: boolean): number | null {
  if (!hasData) return null;
  return Math.round(value * 100);
}

export function buildComparisonSummary(comparison: Comparison): string {
  const { prompt_a: a, prompt_b: b, overall_delta: delta, fields } = comparison;
  if (delta === null) return "";

  const overallPts = Math.round(Math.abs(delta) * 100);
  if (overallPts === 0) {
    return `Prompt A (${a.name}) and Prompt B (${b.name}) performed the same overall.`;
  }

  const winner = delta > 0 ? b : a;
  const loser = delta > 0 ? a : b;
  const winnerLabel = delta > 0 ? "B" : "A";

  const fieldDeltas = fields
    .map((f) => ({
      name: fieldLabel(f.field_name),
      delta: f.delta,
    }))
    .filter(
      (f): f is { name: string; delta: number } =>
        f.delta !== null && f.delta !== 0
    )
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));

  const gains = fieldDeltas.filter((f) =>
    delta > 0 ? (f.delta ?? 0) > 0 : (f.delta ?? 0) < 0
  );
  const top = gains.slice(0, 2);

  let gainPhrase = "";
  if (top.length >= 2) {
    gainPhrase = `, with the largest gains in ${top[0].name} (+${Math.round(
      Math.abs(top[0].delta) * 100
    )}%) and ${top[1].name} (+${Math.round(Math.abs(top[1].delta) * 100)}%)`;
  } else if (top.length === 1) {
    gainPhrase = `, with the largest gain in ${top[0].name} (+${Math.round(
      Math.abs(top[0].delta) * 100
    )}%)`;
  }

  return `Prompt ${winnerLabel} (${winner.name}) outperformed ${loser.name} by ${overallPts} percentage points overall${gainPhrase}.`;
}
