import Link from "next/link";

import { SiteNav } from "@/components/site-nav";

export default function AnalysisPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-8 py-24">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">
          Analysis
        </p>
        <h1 className="mt-6 text-3xl font-medium tracking-tight text-ink">
          Field-level breakdown
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Per-field accuracy charts and run comparisons will live here.
        </p>
        <Link
          href="/"
          className="mt-10 inline-block text-sm text-muted transition-colors hover:text-ink"
        >
          ← Dashboard
        </Link>
      </main>
    </>
  );
}
