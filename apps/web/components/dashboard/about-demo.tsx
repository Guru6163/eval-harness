"use client";

import { Sparkles } from "lucide-react";

import { Reveal } from "@/lib/motion";

export function AboutDemoPanel() {
  return (
    <Reveal as="section" className="mt-24 border-t border-border pt-24">
      <div className="relative overflow-hidden border border-border p-8 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(63,111,92,0.10) 0%, rgba(63,111,92,0) 70%)",
            filter: "blur(40px)",
          }}
        />
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.5} />
          <h2 className="text-xs font-medium tracking-widest text-muted uppercase">
            About this demo
          </h2>
        </div>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink/85">
          The eighteen documents in this corpus are entirely synthetic. They
          mirror common patterns from B2B procurement workflows—supplier quotes,
          inbound RFQs, and follow-up POs across PDF, email, and spreadsheet
          formats—but contain no real customer data.
        </p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
          Each document is scored against hand-authored ground truth for seven
          fields. Extraction uses GPT-4o with a fixed JSON schema; accuracy is
          computed with deterministic rules so results are reproducible. Run{" "}
          <code className="rounded-sm bg-border/50 px-1.5 py-0.5 font-mono text-xs text-ink">
            ./scripts/run_eval.sh
          </code>{" "}
          locally to seed the database and evaluate all documents in one pass.
        </p>
      </div>
    </Reveal>
  );
}
