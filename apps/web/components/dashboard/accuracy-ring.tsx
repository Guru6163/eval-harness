"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { AnimatedNumber } from "@/lib/motion";

interface AccuracyRingProps {
  percent: number | null;
  size?: number;
  stroke?: number;
}

export function AccuracyRing({
  percent,
  size = 200,
  stroke = 4,
}: AccuracyRingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = percent !== null ? Math.max(0, Math.min(100, percent)) : 0;
  const dashOffset = circumference * (1 - target / 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E8E3"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3F6F5C"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: inView ? dashOffset : circumference,
          }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {percent !== null ? (
          <>
            <span className="text-5xl font-medium tabular-nums tracking-tight text-ink">
              <AnimatedNumber value={percent} />
              <span className="text-3xl text-muted">%</span>
            </span>
            <span className="mt-1 text-xs tracking-widest text-muted uppercase">
              accuracy
            </span>
          </>
        ) : (
          <>
            <span className="text-5xl font-medium tabular-nums text-muted">
              —
            </span>
            <span className="mt-1 text-xs tracking-widest text-muted uppercase">
              awaiting run
            </span>
          </>
        )}
      </div>
    </div>
  );
}
