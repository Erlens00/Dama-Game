"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

interface BlockedMarkProps {
  style: CSSProperties;
}

export function BlockedMark({ style }: BlockedMarkProps) {
  return (
    <motion.div
      className="pointer-events-none absolute flex items-center justify-center"
      style={style}
      initial={{ opacity: 0, scale: 0.3, rotate: -25 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
    >
      <svg viewBox="0 0 24 24" className="h-[46%] w-[46%] text-ember-bright/80" strokeWidth={3} stroke="currentColor" fill="none" strokeLinecap="round">
        <motion.line
          x1="5"
          y1="5"
          x2="19"
          y2="19"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.22, delay: 0.05 }}
        />
        <motion.line
          x1="19"
          y1="5"
          x2="5"
          y2="19"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.22, delay: 0.2 }}
        />
      </svg>
    </motion.div>
  );
}
