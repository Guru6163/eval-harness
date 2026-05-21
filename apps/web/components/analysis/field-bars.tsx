import type { FieldAccuracy } from "@/lib/api";

interface FieldBarsProps {
  items: FieldAccuracy[];
}

export function FieldBars({ items }: FieldBarsProps) {
  return (
    <ul className="mt-12 space-y-10">
      {items.map((item) => (
        <li
          key={item.field}
          className="grid grid-cols-[1fr_auto] items-center gap-10"
        >
          <div className="min-w-0">
            <p className="mb-4 text-sm text-ink">{item.label}</p>
            <div className="h-1.5 w-full bg-border">
              <div
                className="h-1.5 bg-accent transition-all"
                style={{
                  width:
                    item.accuracyPercent !== null
                      ? `${item.accuracyPercent}%`
                      : "0%",
                }}
              />
            </div>
          </div>
          <span className="w-12 text-right text-sm font-medium tabular-nums text-ink">
            {item.accuracyPercent !== null ? `${item.accuracyPercent}%` : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}
