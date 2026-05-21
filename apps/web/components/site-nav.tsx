import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="mx-auto flex max-w-5xl items-center justify-between px-8 py-8">
      <Link href="/" className="font-medium text-ink">
        ExtractBench
      </Link>
      <div className="flex items-center gap-8 text-sm text-muted">
        <Link href="/#documents" className="transition-colors hover:text-ink">
          Documents
        </Link>
        <Link href="/analysis" className="transition-colors hover:text-ink">
          Analysis
        </Link>
      </div>
    </nav>
  );
}
