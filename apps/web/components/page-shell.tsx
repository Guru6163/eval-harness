"use client";

import { GridBackground } from "@/components/dashboard/grid-background";
import { SiteNav } from "@/components/site-nav";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <>
      <SiteNav />
      <div className="relative">
        <GridBackground />
        <main
          className={
            className ?? "mx-auto max-w-6xl px-6 pb-40 md:px-8"
          }
        >
          {children}
        </main>
      </div>
    </>
  );
}

export function PageLoading({ message = "Loading…" }: { message?: string }) {
  return (
    <PageShell>
      <p className="py-24 text-sm text-muted">{message}</p>
    </PageShell>
  );
}
