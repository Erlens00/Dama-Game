"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { clsx } from "@/lib/utils/clsx";
import type { Piece } from "@/lib/game/types";

interface PieceViewProps {
  piece: Piece;
  selectable: boolean;
  selected: boolean;
  onClick: () => void;
  style: CSSProperties;
}

export function PieceView({ piece, selectable, selected, onClick, style }: PieceViewProps) {
  const isBlack = piece.color === "black";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="pointer-events-auto absolute rounded-full"
      style={style}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: selected ? 1.1 : 1,
        opacity: 1,
        y: selected ? -6 : 0,
      }}
      exit={{ scale: 0, opacity: 0, rotate: 25 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, y: { duration: 0.15 } }}
      whileHover={selectable ? { scale: 1.06 } : undefined}
      whileTap={selectable ? { scale: 0.95 } : undefined}
      aria-label={`Ficha ${isBlack ? "negra" : "roja"}${piece.type === "king" ? " rey" : ""}`}
    >
      <span
        className={clsx(
          "absolute inset-[9%] rounded-full",
          isBlack
            ? "bg-gradient-to-b from-obsidian-bright to-obsidian shadow-piece"
            : "bg-gradient-to-b from-ember-bright to-ember-dim shadow-piece",
          selected && "ring-4 ring-gold/80",
          selectable && !selected && "ring-2 ring-gold/30"
        )}
      />
      <span
        className="absolute inset-[21%] rounded-full opacity-60"
        style={{
          background: isBlack
            ? "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), transparent 60%)"
            : "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.28), transparent 60%)",
        }}
      />
      {piece.type === "king" && (
        <motion.svg
          viewBox="0 0 24 24"
          className="absolute inset-[32%] text-gold-bright drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          fill="currentColor"
        >
          <path d="M3 18h18v2H3v-2Zm.6-9.6L7 11l5-7 5 7 3.4-2.6L19 17H5L3.6 8.4Z" />
        </motion.svg>
      )}
    </motion.button>
  );
}
