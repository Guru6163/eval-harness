"use client";

import { AnimatedNumber, Stagger, StaggerItem } from "@/lib/motion";

interface StatProps {
  value: number | null;
  display: string;
  label: string;
  bordered?: boolean;
  format?: (n: number) => string;
}

function Stat({ value, display, label, bordered, format }: StatProps) {
  return (
    <StaggerItem
      className={`group relative flex flex-col gap-2 py-2 ${
        bordered ? "md:border-l md:border-border md:pl-10" : ""
      }`}
    >
      <span className="text-4xl font-medium tabular-nums tracking-tight text-ink md:text-5xl">
        {value !== null ? (
          <AnimatedNumber value={value} format={format} />
        ) : (
          display
        )}
        {value !== null && display.endsWith("%") ? (
          <span className="ml-0.5 text-muted">%</span>
        ) : null}
        {value !== null && display.endsWith("s") ? (
          <span className="ml-0.5 text-muted">s</span>
        ) : null}
      </span>
      <span className="text-sm text-muted">{label}</span>
      <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink/40 transition-all duration-500 group-hover:w-12 md:group-hover:w-16" />
    </StaggerItem>
  );
}

interface StatsRowProps {
  overallAccuracy: number | null;
  documentsEvaluated: number;
  totalDocuments: number;
  fieldsScored: number;
  avgLatencySec: number | null;
}

export function StatsRow({
  overallAccuracy,
  documentsEvaluated,
  totalDocuments,
  fieldsScored,
  avgLatencySec,
}: StatsRowProps) {
  return (
    <Stagger
      stagger={0.1}
      delay={0.4}
      className="mt-20 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-4"
    >
      <Stat
        value={overallAccuracy}
        display={overallAccuracy !== null ? `${overallAccuracy}%` : "—"}
        label="Overall accuracy"
      />
      <Stat
        value={documentsEvaluated}
        display={`${documentsEvaluated}`}
        label={`Documents evaluated (${totalDocuments})`}
        bordered
      />
      <Stat
        value={fieldsScored}
        display={`${fieldsScored}`}
        label="Fields scored"
        bordered
      />
      <Stat
        value={avgLatencySec}
        display={avgLatencySec !== null ? `${avgLatencySec.toFixed(1)}s` : "—"}
        label="Avg latency per doc"
        bordered
        format={(n) => n.toFixed(1)}
      />
    </Stagger>
  );
}
