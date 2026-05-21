import type { DocTypeAccuracy } from "@/lib/api";

interface TypeAccuracySectionProps {
  items: DocTypeAccuracy[];
}

export function TypeAccuracySection({ items }: TypeAccuracySectionProps) {
  return (
    <section className="border-t border-border py-20">
      <h2 className="text-sm font-medium tracking-wide text-ink">
        Accuracy by document type
      </h2>
      <ul className="mt-12 space-y-10">
        {items.map((item) => (
          <li
            key={item.key}
            className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto] sm:gap-6 md:gap-10"
          >
            <span className="w-10 text-sm font-medium tabular-nums text-muted">
              {item.index}
            </span>
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
    </section>
  );
}
