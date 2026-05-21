import type { Comparison } from "@/lib/api";
import {
  COMPARISON_FIELD_ORDER,
  fieldLabel,
  formatAccuracyPercent,
  formatDelta,
} from "@/lib/comparison";

function ChangeCell({ delta }: { delta: number | null }) {
  const { text, variant } = formatDelta(delta);
  if (variant === "none") {
    return <span className="text-muted">{text}</span>;
  }
  const color = variant === "up" ? "text-pass" : "text-fail";
  const arrow = variant === "up" ? "↑" : "↓";
  return (
    <span className={`inline-flex items-center gap-1 font-medium tabular-nums ${color}`}>
      <span className="text-[10px] leading-none" aria-hidden>
        {arrow}
      </span>
      {text}
    </span>
  );
}

interface ComparisonTableProps {
  comparison: Comparison;
}

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  const fieldByName = new Map(
    comparison.fields.map((f) => [f.field_name, f])
  );

  const nameA = comparison.prompt_a.name;
  const nameB = comparison.prompt_b.name;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-cream/80">
            <th className="px-5 py-3.5 text-left text-xs font-medium tracking-widest text-muted uppercase">
              Field
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-medium tracking-widest text-muted uppercase">
              {nameA}
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-medium tracking-widest text-muted uppercase">
              {nameB}
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-medium tracking-widest text-muted uppercase">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_FIELD_ORDER.map((fieldName) => {
            const row = fieldByName.get(fieldName);
            return (
              <tr
                key={fieldName}
                className="border-b border-border/80 transition-colors last:border-b-0 hover:bg-cream/40"
              >
                <td className="px-5 py-3.5 font-medium text-ink">
                  {fieldLabel(fieldName)}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-ink">
                  {formatAccuracyPercent(row?.accuracy_a ?? null)}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-ink">
                  {formatAccuracyPercent(row?.accuracy_b ?? null)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <ChangeCell delta={row?.delta ?? null} />
                </td>
              </tr>
            );
          })}
          <tr className="bg-cream/60">
            <td className="px-5 py-4 font-medium text-ink">Overall</td>
            <td className="px-5 py-4 text-right font-medium tabular-nums text-ink">
              {formatAccuracyPercent(comparison.overall_accuracy_a)}
            </td>
            <td className="px-5 py-4 text-right font-medium tabular-nums text-ink">
              {formatAccuracyPercent(comparison.overall_accuracy_b)}
            </td>
            <td className="px-5 py-4 text-right font-medium">
              <ChangeCell delta={comparison.overall_delta} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
