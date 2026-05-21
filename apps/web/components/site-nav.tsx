"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "motion/react";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ??
  "https://github.com/your-org/extractbench";

const LINKS = [
  { href: "/#documents", label: "Documents", match: (p: string) => p === "/" },
  { href: "/analysis", label: "Analysis", match: (p: string) => p.startsWith("/analysis") },
  { href: "/comparison", label: "Comparison", match: (p: string) => p.startsWith("/comparison") },
  { href: "/prompt", label: "Prompt", match: (p: string) => p.startsWith("/prompt") },
];

export function SiteNav() {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.2,
  });

  return (
    <>
      <motion.div
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 z-50 h-px origin-left bg-accent"
      />
      <nav className="sticky top-0 z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-b border-border/60 px-8 py-5">
          <Link
            href="/"
            className="group flex items-center gap-2 font-medium text-ink"
          >
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">
              ExtractBench
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted sm:gap-8">
            {LINKS.map((link) => {
              const active = link.match(pathname ?? "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative transition-colors hover:text-ink"
                >
                  <span className={active ? "text-ink" : ""}>{link.label}</span>
                  <span
                    className={`absolute -bottom-1 left-0 h-px bg-ink transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 transition-colors hover:text-ink"
            >
              GitHub
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.5}
              />
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}
