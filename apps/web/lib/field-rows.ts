import type { FieldScore, GroundTruth } from "@/lib/api";
import { SCORED_FIELDS, type MatchType, type ScoredField } from "@/lib/fields";

export interface FieldComparisonRow {
  field: ScoredField;
  expected: unknown;
  extracted: unknown;
  score: number | null;
  matchType: MatchType | null;
}

export function buildFieldRows(
  groundTruths: GroundTruth[],
  latestRun: {
    extracted_value: Record<string, unknown>;
    field_scores: FieldScore[];
  } | null
): FieldComparisonRow[] {
  const truthByField = Object.fromEntries(
    groundTruths.map((g) => [g.field_name, g.expected_value])
  );
  const scoreByField = Object.fromEntries(
    (latestRun?.field_scores ?? []).map((s) => [s.field_name, s])
  );

  return SCORED_FIELDS.map((field) => {
    const fs = scoreByField[field];
    return {
      field,
      expected: truthByField[field] ?? null,
      extracted: latestRun?.extracted_value?.[field] ?? null,
      score: fs?.score ?? null,
      matchType: fs?.match_type ?? null,
    };
  });
}
