"use client";

import { AnimatedBar, AnimatedNumber, Stagger, StaggerItem } from "@/lib/motion";
import type { FieldAccuracy } from "@/lib/api";

interface FieldBarsProps {
  items: FieldAccuracy[];
}

export function FieldBars({ items }: FieldBarsProps) {
  return (
    <Stagger stagger={0.08} className="mt-14">
      <ul className="space-y-12">
        {items.map((item, idx) => (
          <StaggerItem
            key={item.field}
            as="li"
            className="group grid grid-cols-[1fr_auto] items-center gap-10"
          >
            <div className="min-w-0">
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-xs tabular-nums text-muted">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="h-px w-6 bg-border transition-all duration-300 group-hover:w-10 group-hover:bg-accent" />
                <p className="text-base font-medium text-ink">{item.label}</p>
              </div>
              <AnimatedBar
                percent={item.accuracyPercent ?? 0}
                delay={idx * 0.06}
                className="h-1.5 bg-gradient-to-r from-accent to-accent/70"
                trackClassName="h-1.5 w-full overflow-hidden bg-border"
              />
            </div>
            <span className="text-right text-2xl font-medium tabular-nums tracking-tight text-ink">
              {item.accuracyPercent !== null ? (
                <>
                  <AnimatedNumber value={item.accuracyPercent} />
                  <span className="text-base text-muted">%</span>
                </>
              ) : (
                "—"
              )}
            </span>
          </StaggerItem>
        ))}
      </ul>
    </Stagger>
  );
}
