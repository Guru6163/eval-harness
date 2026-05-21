"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Layers, Lightbulb } from "lucide-react";

import { FieldBars } from "@/components/analysis/field-bars";
import { PromptComparisonPanel } from "@/components/analysis/prompt-comparison-panel";
import { AnalysisHero } from "@/components/analysis/analysis-hero";
import { FailureModesTable } from "@/components/analysis/failure-modes-table";
import { NextSection } from "@/components/analysis/next-section";
import { PageLoading, PageShell } from "@/components/page-shell";
import { Reveal } from "@/lib/motion";
import { type FieldAccuracy, getFieldAccuracy } from "@/lib/api";

const FAILURE_MODES = [
  {
    mode: "Scanned PDF OCR errors",
    count: 8,
    example: "8/8 misread — totals and SKUs drift from ground truth",
  },
  {
    mode: "Multi-tier pricing collapsed to single price",
    count: 3,
    example: "EUR Tier 2 (18 units) merged into one unit_price",
  },
  {
    mode: "Currency assumed USD when EUR",
    count: 2,
    example: "Meridian EU quote returned USD in extraction",
  },
  {
    mode: "Lead time absent in source — model hallucinated",
    count: 4,
    example: "Scanned valve quote with illegible lead time filled as 14d",
  },
  {
    mode: "Ambiguous SKU references (\u201Cthe usual\u201D)",
    count: 5,
    example: "Forwarded email RFQ — line_items missing HF-CB-38",
  },
  {
    mode: "Price buried in prose",
    count: 3,
    example: "Lumber scan: unit prices inferred wrong from ~47.25/ea text",
  },
];

export default function AnalysisPage() {
  const [fieldAccuracy, setFieldAccuracy] = useState<FieldAccuracy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFieldAccuracy()
      .then((items) => {
        if (!cancelled) setFieldAccuracy(items);
      })
      .catch(() => {
        if (!cancelled) setFieldAccuracy([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PageLoading message="Loading analysis…" />;
  }

  return (
    <PageShell>
      <AnalysisHero />

      <section className="border-t border-border py-24">
        <h2 className="text-xs font-medium tracking-widest text-muted uppercase">
          Compare prompts
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Pick two saved prompt versions and compare field-level accuracy
          across documents that have runs for both.
        </p>
        <div className="mt-10">
          <PromptComparisonPanel />
        </div>
      </section>

      <Reveal as="section" className="border-t border-border py-24">
        <div className="flex items-center gap-3">
          <Layers className="h-4 w-4 text-accent" strokeWidth={1.5} />
          <h2 className="text-xs font-medium tracking-widest text-muted uppercase">
            Section · 01 — Accuracy by field
          </h2>
        </div>
        <FieldBars items={fieldAccuracy} />
      </Reveal>

      <Reveal as="section" className="border-t border-border py-24">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-fail" strokeWidth={1.5} />
          <h2 className="text-xs font-medium tracking-widest text-muted uppercase">
            Section · 02 — Failure modes
          </h2>
        </div>
        <FailureModesTable rows={FAILURE_MODES} />
      </Reveal>

      <Reveal as="section" className="border-t border-border py-24">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-4 w-4 text-partial" strokeWidth={1.5} />
          <h2 className="text-xs font-medium tracking-widest text-muted uppercase">
            Section · 03 — What I would build next
          </h2>
        </div>
        <NextSection />
      </Reveal>
    </PageShell>
  );
}
