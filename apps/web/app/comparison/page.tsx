import Link from "next/link";

import { PromptComparisonPanel } from "@/components/analysis/prompt-comparison-panel";
import { GridBackground } from "@/components/dashboard/grid-background";
import { SiteNav } from "@/components/site-nav";

export const dynamic = "force-dynamic";

export default async function ComparisonPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt_a?: string; prompt_b?: string }>;
}) {
  const params = await searchParams;
  const promptA = params.prompt_a?.trim();
  const promptB = params.prompt_b?.trim();
  const hasPair =
    Boolean(promptA) && Boolean(promptB) && promptA !== promptB;

  return (
    <>
      <SiteNav />
      <div className="relative">
        <GridBackground />
        <main className="mx-auto max-w-6xl px-6 pb-40 md:px-8">
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
              <Link href="/prompt" className="text-accent underline-offset-2 hover:underline">
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
                initialPromptAId={hasPair ? promptA : undefined}
                initialPromptBId={hasPair ? promptB : undefined}
                autoCompare={hasPair}
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
