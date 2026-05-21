import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DocPillProps {
  children: ReactNode;
  className?: string;
}

export function DocPill({ children, className }: DocPillProps) {
  return (
    <span
      className={cn(
        "inline-block border border-border px-3 py-1 text-xs tracking-wide text-ink",
        className
      )}
    >
      {children}
    </span>
  );
}
