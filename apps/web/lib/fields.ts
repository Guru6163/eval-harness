export const SCORED_FIELDS = [
  "vendor_name",
  "line_items",
  "total_amount",
  "currency",
  "lead_time_days",
  "payment_terms",
  "validity_date",
] as const;

export type ScoredField = (typeof SCORED_FIELDS)[number];

export const FIELD_LABELS: Record<ScoredField, string> = {
  vendor_name: "Vendor name",
  line_items: "Line items",
  total_amount: "Total amount",
  currency: "Currency",
  lead_time_days: "Lead time (days)",
  payment_terms: "Payment terms",
  validity_date: "Validity date",
};

export type MatchType = "exact" | "partial" | "missing" | "wrong";

export function matchTypeLabel(type: MatchType): string {
  const labels: Record<MatchType, string> = {
    exact: "✓ exact",
    partial: "◐ partial",
    missing: "✕ missing",
    wrong: "✕ wrong",
  };
  return labels[type];
}

export function matchTypeClass(type: MatchType): string {
  if (type === "exact") return "text-accent";
  if (type === "partial") return "text-partial";
  return "text-fail";
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return JSON.stringify(value, null, 2);
  }
  return JSON.stringify(value, null, 2);
}

export function derivedTitle(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return base.replace(/[_-]+/g, " ");
}
