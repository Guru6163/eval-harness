"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DocumentHero } from "@/components/documents/document-hero";
import { FieldComparison } from "@/components/documents/field-comparison";
import { PageLoading, PageShell } from "@/components/page-shell";
import { buildFieldRows } from "@/lib/field-rows";
import { Reveal } from "@/lib/motion";
import { resolveFailureAnalysis } from "@/lib/document-analysis";
import { type DocumentDetail, getDocument } from "@/lib/api";
import { derivedTitle } from "@/lib/fields";

export default function DocumentPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setDoc(null);

    getDocument(id)
      .then((d) => {
        if (!cancelled) setDoc(d);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <PageLoading message="Loading document…" />;
  }

  if (notFound || !doc) {
    return (
      <PageShell>
        <div className="py-24">
          <h1 className="text-2xl font-medium text-ink">Document not found</h1>
          <p className="mt-4 text-sm text-muted">
            No document matches this id, or the API is unavailable.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-accent underline-offset-2 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </PageShell>
    );
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
    <PageShell>
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
    </PageShell>
  );
}
