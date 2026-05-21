import type { FieldScore, GroundTruth } from "@/lib/api";
import {
  FIELD_LABELS,
  formatFieldValue,
  matchTypeClass,
  matchTypeLabel,
  SCORED_FIELDS,
  type MatchType,
  type ScoredField,
} from "@/lib/fields";

export interface FieldComparisonRow {
  field: ScoredField;
  expected: unknown;
  extracted: unknown;
  score: number | null;
  matchType: MatchType | null;
}

interface FieldComparisonProps {
  rows: FieldComparisonRow[];
}

export function FieldComparison({ rows }: FieldComparisonProps) {
  return (
    <div>
      {rows.map((row, index) => (
        <div
          key={row.field}
          className={
            index > 0 ? "border-t border-border py-8" : "pb-8"
          }
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-ink">
              {FIELD_LABELS[row.field]}
            </p>
            <div className="flex shrink-0 items-center gap-4">
              {row.matchType ? (
                <span
                  className={`text-xs tracking-wide ${matchTypeClass(row.matchType)}`}
                >
                  {matchTypeLabel(row.matchType)}
                </span>
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
              <span className="w-10 text-right text-xs tabular-nums text-muted">
                {row.score !== null
                  ? row.score.toFixed(2)
                  : "—"}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs tracking-wide text-muted uppercase">
                Expected
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted">
                {formatFieldValue(row.expected)}
              </pre>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted uppercase">
                Extracted
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink">
                {formatFieldValue(row.extracted)}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
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
