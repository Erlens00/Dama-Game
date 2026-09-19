"use client";

import { motion } from "framer-motion";
import { clsx } from "@/lib/utils/clsx";

interface SquareProps {
  row: number;
  col: number;
  dark: boolean;
  isHopTarget: boolean;
  isCaptureTarget: boolean;
  onClick: () => void;
}

export function Square({ dark, isHopTarget, isCaptureTarget, onClick }: SquareProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "absolute inset-0 h-full w-full transition-colors",
        dark ? "bg-walnut" : "bg-parchment/90",
        dark && "shadow-[inset_0_0_18px_rgba(0,0,0,0.35)]"
      )}
      aria-label="Casilla del tablero"
    >
      {dark && (
        <span
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08), transparent 55%), linear-gradient(160deg, rgba(255,255,255,0.05), transparent 60%)",
          }}
        />
      )}
      {isHopTarget && !isCaptureTarget && (
        <motion.span
          className="pointer-events-none absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/70"
          initial={{ scale: 0 }}
          animate={{ scale: [0.85, 1, 0.85] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {isCaptureTarget && (
        <motion.span
          className="pointer-events-none absolute inset-[8%] rounded-lg border-[3px] border-ember-bright"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </button>
  );
}
