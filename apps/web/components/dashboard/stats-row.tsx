interface StatProps {
  value: string;
  label: string;
  bordered?: boolean;
}

function Stat({ value, label, bordered }: StatProps) {
  return (
    <div
      className={`flex flex-col gap-2 py-2 ${bordered ? "border-l border-border pl-10" : ""}`}
    >
      <span className="text-4xl font-medium tabular-nums tracking-tight text-ink">
        {value}
      </span>
      <span className="text-sm text-muted">{label}</span>
    </div>
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
    <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
      <Stat
        value={
          overallAccuracy !== null ? `${overallAccuracy}%` : "—"
        }
        label="Overall accuracy"
      />
      <Stat
        value={`${documentsEvaluated}`}
        label={`Documents evaluated (${totalDocuments})`}
        bordered
      />
      <Stat
        value={`~${fieldsScored}`}
        label="Fields scored"
        bordered
      />
      <Stat
        value={
          avgLatencySec !== null ? `${avgLatencySec.toFixed(1)}s` : "—"
        }
        label="Avg latency per doc"
        bordered
      />
    </div>
  );
}
