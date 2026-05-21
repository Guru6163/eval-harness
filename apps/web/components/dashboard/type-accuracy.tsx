"use client";

import { ArrowUpRight } from "lucide-react";

import { AnimatedBar, AnimatedNumber, Reveal, Stagger, StaggerItem } from "@/lib/motion";
import type { DocTypeAccuracy } from "@/lib/api";

interface TypeAccuracySectionProps {
  items: DocTypeAccuracy[];
}

export function TypeAccuracySection({ items }: TypeAccuracySectionProps) {
  return (
    <section className="border-t border-border py-24">
      <Reveal className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs tracking-widest text-muted uppercase">
            Section · 01
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
            Accuracy by document type
          </h2>
        </div>
        <ArrowUpRight
          className="hidden h-6 w-6 text-muted sm:block"
          strokeWidth={1.25}
        />
      </Reveal>

      <Stagger stagger={0.12} delay={0.1} className="mt-14">
        <ul className="space-y-12">
          {items.map((item, idx) => (
            <StaggerItem
              key={item.key}
              as="li"
              className="group grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto] sm:gap-8 md:gap-12"
            >
              <span className="flex items-center gap-3 text-sm font-medium tabular-nums text-muted">
                <span className="font-mono">{item.index}</span>
                <span className="hidden h-px w-6 bg-border transition-all duration-300 group-hover:w-10 group-hover:bg-accent sm:inline-block" />
              </span>
              <div className="min-w-0">
                <p className="mb-4 text-base font-medium text-ink transition-colors group-hover:text-ink">
                  {item.label}
                </p>
                <AnimatedBar
                  percent={item.accuracyPercent ?? 0}
                  delay={idx * 0.1}
                  className="h-1.5 bg-gradient-to-r from-accent to-accent/70"
                  trackClassName="relative h-1.5 w-full overflow-hidden bg-border"
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
    </section>
  );
}
