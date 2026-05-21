import Link from "next/link";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ??
  "https://github.com/your-org/extractbench";

export function SiteNav() {
  return (
    <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-8 py-8">
      <Link href="/" className="font-medium text-ink">
        ExtractBench
      </Link>
      <div className="flex flex-wrap items-center gap-6 text-sm text-muted sm:gap-8">
        <Link href="/#documents" className="transition-colors hover:text-ink">
          Documents
        </Link>
        <Link href="/analysis" className="transition-colors hover:text-ink">
          Analysis
        </Link>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-ink"
        >
          View on GitHub
        </a>
      </div>
    </nav>
  );
}
