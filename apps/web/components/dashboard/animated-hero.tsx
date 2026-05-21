"use client";

import { motion } from "motion/react";

import { AccuracyRing } from "@/components/dashboard/accuracy-ring";
import { StatsRow } from "@/components/dashboard/stats-row";

interface AnimatedHeroProps {
  overallAccuracy: number | null;
  documentsEvaluated: number;
  totalDocuments: number;
  fieldsScored: number;
  avgLatencySec: number | null;
  error: string | null;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function AnimatedHero({
  overallAccuracy,
  documentsEvaluated,
  totalDocuments,
  fieldsScored,
  avgLatencySec,
  error,
}: AnimatedHeroProps) {
  return (
    <header className="relative py-24">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[1fr_auto] md:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center gap-3"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <p className="text-xs font-medium tracking-widest text-muted uppercase">
              Evaluation harness · Live
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            className="mt-8 max-w-3xl text-5xl font-medium tracking-tight text-balance text-ink md:text-6xl"
          >
            Extraction accuracy across{" "}
            <span className="relative inline-block">
              <span className="relative z-10">18 documents</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: EASE, delay: 0.9 }}
                style={{ transformOrigin: "left center" }}
                className="absolute bottom-1 left-0 z-0 h-2 w-full bg-accent/15"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
            className="mt-6 max-w-2xl text-lg text-pretty text-muted"
          >
            Measures how reliably GPT-4o extracts structured procurement fields
            from messy supplier quotes, customer requests, and purchase orders.
          </motion.p>

          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-sm text-fail"
            >
              API unavailable — start the backend at localhost:8000.
            </motion.p>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
          className="hidden md:block"
        >
          <AccuracyRing percent={overallAccuracy} />
        </motion.div>
      </div>

      <div className="mt-16 md:hidden">
        <AccuracyRing percent={overallAccuracy} size={160} />
      </div>

      <StatsRow
        overallAccuracy={overallAccuracy}
        documentsEvaluated={documentsEvaluated}
        totalDocuments={totalDocuments}
        fieldsScored={fieldsScored}
        avgLatencySec={avgLatencySec}
      />
    </header>
  );
}
