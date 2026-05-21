"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import { DocPill } from "@/components/documents/doc-pill";
import { formatDocType, formatSourceFormat } from "@/lib/api";
import type { DocType, SourceFormat } from "@/lib/api";

const EASE = [0.16, 1, 0.3, 1] as const;

interface DocumentHeroProps {
  filename: string;
  title: string;
  docType: DocType;
  sourceFormat: SourceFormat;
  accuracy: number | null;
}

export function DocumentHero({
  filename,
  title,
  docType,
  sourceFormat,
  accuracy,
}: DocumentHeroProps) {
  return (
    <header className="py-16">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Link
          href="/#documents"
          className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            strokeWidth={1.5}
          />
          Documents
          <span className="mx-1 text-muted">/</span>
          <span className="truncate text-ink">{filename}</span>
        </Link>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        className="mt-8 text-3xl font-medium tracking-tight text-balance text-ink md:text-4xl"
      >
        {title}
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
        className="mt-6 flex flex-wrap gap-3"
      >
        <DocPill>{formatDocType(docType)}</DocPill>
        <DocPill>{formatSourceFormat(sourceFormat)}</DocPill>
        <DocPill>
          {accuracy !== null ? (
            <>
              <span className="tabular-nums">{accuracy}%</span> accuracy
            </>
          ) : (
            "Not evaluated"
          )}
        </DocPill>
      </motion.div>
    </header>
  );
}
