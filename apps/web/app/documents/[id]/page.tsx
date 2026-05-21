import Link from "next/link";
import { notFound } from "next/navigation";

import { DocPill } from "@/components/documents/doc-pill";
import {
  buildFieldRows,
  FieldComparison,
} from "@/components/documents/field-comparison";
import { SiteNav } from "@/components/site-nav";
import { resolveFailureAnalysis } from "@/lib/document-analysis";
import {
  formatDocType,
  formatSourceFormat,
  getDocument,
} from "@/lib/api";
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
      <main className="pb-32">
        <header className="mx-auto max-w-6xl px-8 py-16">
          <nav className="text-sm text-muted">
            <Link href="/#documents" className="transition-colors hover:text-ink">
              Documents
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{doc.filename}</span>
          </nav>
          <h1 className="mt-6 text-3xl font-medium tracking-tight text-ink">
            {derivedTitle(doc.filename)}
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <DocPill>{formatDocType(doc.doc_type)}</DocPill>
            <DocPill>{formatSourceFormat(doc.source_format)}</DocPill>
            <DocPill>
              {accuracy !== null ? (
                <>
                  <span className="tabular-nums">{accuracy}%</span> accuracy
                </>
              ) : (
                "Not evaluated"
              )}
            </DocPill>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-8 md:grid-cols-2">
          <section>
            <p className="text-xs font-medium tracking-widest text-muted uppercase">
              Source document
            </p>
            <div className="mt-4 border border-border p-8">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink">
                {doc.raw_content}
              </pre>
            </div>
          </section>

          <section>
            <p className="text-xs font-medium tracking-widest text-muted uppercase">
              Extraction result
            </p>
            <div className="mt-4">
              {latestRun ? (
                <FieldComparison rows={fieldRows} />
              ) : (
                <p className="text-sm text-muted">
                  No extraction run yet. POST to{" "}
                  <code className="font-mono text-xs">
                    /api/runs/{doc.id}
                  </code>{" "}
                  to evaluate.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mx-auto mt-20 max-w-6xl border-t border-border px-8 pt-16">
          <h2 className="text-2xl font-medium tracking-tight text-ink">
            Failure analysis
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink/90">
            {failureAnalysis}
          </p>
        </section>
      </main>
    </>
  );
}
