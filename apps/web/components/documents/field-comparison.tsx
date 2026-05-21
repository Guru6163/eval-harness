"use client";

import { Check, CircleDot, Minus, X } from "lucide-react";

import { Stagger, StaggerItem } from "@/lib/motion";
import type { FieldComparisonRow } from "@/lib/field-rows";
import {
  FIELD_LABELS,
  formatFieldValue,
  matchTypeClass,
  type MatchType,
} from "@/lib/fields";

interface FieldComparisonProps {
  rows: FieldComparisonRow[];
}

function MatchIcon({ type }: { type: MatchType }) {
  if (type === "exact") return <Check className="h-3.5 w-3.5" strokeWidth={2} />;
  if (type === "partial")
    return <CircleDot className="h-3.5 w-3.5" strokeWidth={2} />;
  if (type === "missing") return <Minus className="h-3.5 w-3.5" strokeWidth={2} />;
  return <X className="h-3.5 w-3.5" strokeWidth={2} />;
}

function matchTypeText(type: MatchType): string {
  return type;
}

export function FieldComparison({ rows }: FieldComparisonProps) {
  return (
    <Stagger stagger={0.06}>
      {rows.map((row, index) => (
        <StaggerItem
          key={row.field}
          className={`group ${index > 0 ? "border-t border-border py-8" : "pb-8"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-ink">
              {FIELD_LABELS[row.field]}
            </p>
            <div className="flex shrink-0 items-center gap-4">
              {row.matchType ? (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs tracking-wide ${matchTypeClass(row.matchType)}`}
                >
                  <MatchIcon type={row.matchType} />
                  {matchTypeText(row.matchType)}
                </span>
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
              <span className="w-10 text-right text-xs tabular-nums text-muted">
                {row.score !== null ? row.score.toFixed(2) : "—"}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
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
        </StaggerItem>
      ))}
    </Stagger>
  );
}
