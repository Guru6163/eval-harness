"use client";

import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AnalysisHero() {
  return (
    <header className="py-24">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="text-xs font-medium tracking-widest text-muted uppercase"
      >
        Analysis
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        className="mt-6 max-w-3xl text-5xl font-medium tracking-tight text-balance text-ink md:text-6xl"
      >
        Where extraction{" "}
        <span className="relative inline-block">
          <span className="relative z-10">breaks down</span>
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: EASE, delay: 0.9 }}
            style={{ transformOrigin: "left center" }}
            className="absolute bottom-1 left-0 z-0 h-2 w-full bg-fail/15"
          />
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
        className="mt-6 max-w-2xl text-lg text-pretty text-muted"
      >
        Field-level accuracy and recurring failure patterns across the
        evaluation corpus.
      </motion.p>
    </header>
  );
}
