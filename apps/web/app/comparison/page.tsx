"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { PromptComparisonPanel } from "@/components/analysis/prompt-comparison-panel";
import { PageLoading, PageShell } from "@/components/page-shell";

function ComparisonPageContent() {
  const searchParams = useSearchParams();
  const promptA = searchParams.get("prompt_a")?.trim();
  const promptB = searchParams.get("prompt_b")?.trim();
  const hasPair =
    Boolean(promptA) && Boolean(promptB) && promptA !== promptB;

  return (
    <PageShell>
      <header className="py-24">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">
          Comparison
        </p>
        <h1 className="mt-6 max-w-3xl text-5xl font-medium tracking-tight text-balance text-ink md:text-6xl">
          Prompt comparison
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-muted">
          Side-by-side accuracy by field and document type. Run evaluations
          from the{" "}
          <Link
            href="/prompt"
            className="text-accent underline-offset-2 hover:underline"
          >
            prompt editor
          </Link>{" "}
          first, then compare versions here.
        </p>
      </header>

      <section className="border-t border-border py-24">
        <h2 className="text-xs font-medium tracking-widest text-muted uppercase">
          Compare prompts
        </h2>
        <div className="mt-10">
          <PromptComparisonPanel
            initialPromptAId={hasPair ? promptA! : undefined}
            initialPromptBId={hasPair ? promptB! : undefined}
            autoCompare={hasPair}
          />
        </div>
      </section>
    </PageShell>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={<PageLoading message="Loading comparison…" />}>
      <ComparisonPageContent />
    </Suspense>
  );
}
