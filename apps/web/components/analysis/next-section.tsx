"use client";

import { Stagger, StaggerItem } from "@/lib/motion";

const PARAGRAPHS = [
  "[Placeholder — describe the highest-leverage product follow-up. Example: a human-in-the-loop review queue for partial extractions, with one-click accept/reject per field and automatic re-prompting on failure clusters.]",
  "[Placeholder — technical direction. Example: fine-tuned smaller models per document type, with GPT-4o reserved for low-confidence fields only; cache OCR layers for scanned PDFs.]",
  "[Placeholder — evaluation expansion. Example: add layout-aware PDF parsing, multilingual quotes, and attachment-heavy email threads; score calibration curves by format not just aggregate %.]",
  "[Placeholder — closing note on why this harness matters for your roadmap and what metric would gate a production rollout.]",
];

export function NextSection() {
  return (
    <Stagger stagger={0.1} className="mt-12 max-w-3xl space-y-5">
      {PARAGRAPHS.map((p, i) => (
        <StaggerItem
          key={i}
          className="text-base leading-relaxed text-ink/85"
        >
          {p}
        </StaggerItem>
      ))}
    </Stagger>
  );
}
