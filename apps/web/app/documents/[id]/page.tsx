import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteNav } from "@/components/site-nav";
import { formatDocType, formatSourceFormat, scoreToStatus } from "@/lib/api";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getDocument(id: string) {
  const res = await fetch(`${API_URL}/api/documents/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load document");
  return res.json();
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  const accuracy =
    doc.latest_score !== null ? Math.round(doc.latest_score * 100) : null;
  const status = scoreToStatus(doc.latest_score);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-8 py-16 pb-32">
        <Link
          href="/#documents"
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          ← All documents
        </Link>
        <h1 className="mt-8 text-3xl font-medium tracking-tight text-ink">
          {doc.filename}
        </h1>
        <dl className="mt-8 grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
          <div>
            <dt className="text-muted">Type</dt>
            <dd className="mt-1 text-ink">{formatDocType(doc.doc_type)}</dd>
          </div>
          <div>
            <dt className="text-muted">Format</dt>
            <dd className="mt-1 text-ink">
              {formatSourceFormat(doc.source_format)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Accuracy</dt>
            <dd className="mt-1 tabular-nums text-ink">
              {accuracy !== null ? `${accuracy}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="mt-1 text-ink">{status}</dd>
          </div>
        </dl>
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="text-sm font-medium text-ink">Document text</h2>
          <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink/90">
            {doc.raw_content}
          </pre>
        </section>
      </main>
    </>
  );
}
