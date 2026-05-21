"use client";

import { AnimatedNumber, Stagger, StaggerItem } from "@/lib/motion";

interface FailureMode {
  mode: string;
  count: number;
  example: string;
}

interface FailureModesTableProps {
  rows: FailureMode[];
}

export function FailureModesTable({ rows }: FailureModesTableProps) {
  return (
    <Stagger stagger={0.06} className="mt-12">
      <div className="grid grid-cols-[1.6fr_auto_2fr] gap-6 border-b border-border pb-3 text-xs tracking-wide text-muted uppercase">
        <span>Failure mode</span>
        <span className="text-right">Count</span>
        <span>Example</span>
      </div>
      {rows.map((row, idx) => (
        <StaggerItem
          key={row.mode}
          className="group grid grid-cols-[1.6fr_auto_2fr] items-start gap-6 border-b border-border py-5"
        >
          <span className="flex items-start gap-3 text-sm text-ink">
            <span className="mt-0.5 font-mono text-xs tabular-nums text-muted">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="transition-colors group-hover:text-ink">
              {row.mode}
            </span>
          </span>
          <span className="text-right text-base tabular-nums text-ink">
            <AnimatedNumber value={row.count} />
          </span>
          <span className="text-sm text-muted">{row.example}</span>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
