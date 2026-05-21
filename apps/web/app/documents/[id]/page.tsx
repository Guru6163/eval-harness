import { notFound } from "next/navigation";

import { DocumentHero } from "@/components/documents/document-hero";
import { FieldComparison } from "@/components/documents/field-comparison";
import { GridBackground } from "@/components/dashboard/grid-background";
import { buildFieldRows } from "@/lib/field-rows";
import { SiteNav } from "@/components/site-nav";
import { Reveal } from "@/lib/motion";
import { resolveFailureAnalysis } from "@/lib/document-analysis";
import { getDocument } from "@/lib/api";
import { derivedTitle } from "@/lib/fields";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let doc;
  try {
    doc = await getDocument(id);
  } catch {
    notFound();
  }

  const latestRun = doc.extraction_runs[0] ?? null;
  const accuracy =
    doc.latest_score !== null ? Math.round(doc.latest_score * 100) : null;
  const fieldRows = buildFieldRows(doc.ground_truths, latestRun);
  const failureAnalysis = resolveFailureAnalysis(
    doc.id,
    doc.notes,
    latestRun?.field_scores ?? []
  );

  return (
    <>
      <SiteNav />
      <div className="relative">
        <GridBackground />
        <main className="mx-auto max-w-6xl px-6 pb-40 md:px-8">
          <DocumentHero
            filename={doc.filename}
            title={derivedTitle(doc.filename)}
            docType={doc.doc_type}
            sourceFormat={doc.source_format}
            accuracy={accuracy}
          />

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <Reveal as="section">
              <p className="text-xs font-medium tracking-widest text-muted uppercase">
                Source document
              </p>
              <div className="mt-4 border border-border bg-cream/60 p-8 backdrop-blur-sm">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink">
                  {doc.raw_content}
                </pre>
              </div>
            </Reveal>

            <Reveal as="section" delay={0.1}>
              <p className="text-xs font-medium tracking-widest text-muted uppercase">
                Extraction result
              </p>
              <div className="mt-4">
                {latestRun ? (
                  <FieldComparison rows={fieldRows} />
                ) : (
                  <p className="text-sm text-muted">
                    No extraction run yet. POST to{" "}
                    <code className="rounded-sm bg-border/50 px-1.5 py-0.5 font-mono text-xs text-ink">
                      /api/runs/{doc.id}
                    </code>{" "}
                    to evaluate.
                  </p>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal as="section" className="mt-24 border-t border-border pt-16">
            <h2 className="text-2xl font-medium tracking-tight text-ink">
              Failure analysis
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink/85">
              {failureAnalysis}
            </p>
          </Reveal>
        </main>
      </div>
    </>
  );
}
