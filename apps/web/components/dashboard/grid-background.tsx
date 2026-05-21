"use client";

import { motion } from "motion/react";

export function GridBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #E8E8E3 1px, transparent 1px), linear-gradient(to bottom, #E8E8E3 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 90%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.2 }}
        className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(63,111,92,0.10) 0%, rgba(63,111,92,0.0) 70%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        initial={{ x: -60, y: 60, opacity: 0 }}
        animate={{ x: 40, y: 20, opacity: 1 }}
        transition={{
          duration: 14,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute top-40 -left-32 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(63,111,92,0.08) 0%, rgba(63,111,92,0) 70%)",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        initial={{ x: 60, y: -40, opacity: 0 }}
        animate={{ x: -20, y: 30, opacity: 1 }}
        transition={{
          duration: 18,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute top-20 -right-32 h-80 w-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(10,10,10,0.04) 0%, rgba(10,10,10,0) 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}
