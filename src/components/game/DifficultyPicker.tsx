"use client";

import { motion } from "framer-motion";
import { clsx } from "@/lib/utils/clsx";
import type { Difficulty } from "@/lib/game/types";

interface DifficultyOption {
  id: Difficulty;
  name: string;
  tagline: string;
  detail: string;
}

const OPTIONS: DifficultyOption[] = [
  {
    id: "easy",
    name: "Fácil",
    tagline: "Para aprender las reglas",
    detail: "Analiza pocas jugadas y comete errores con frecuencia.",
  },
  {
    id: "medium",
    name: "Media",
    tagline: "Un reto equilibrado",
    detail: "Planifica varias jugadas por adelantado y prioriza capturas.",
  },
  {
    id: "hard",
    name: "Difícil",
    tagline: "Muy fuerte",
    detail: "Búsqueda profunda con poda alfa-beta. Pocos errores.",
  },
  {
    id: "extreme",
    name: "Extremo",
    tagline: "Casi imposible de vencer",
    detail: "Nunca comete errores a propósito y planifica varias jugadas por delante, no solo la inmediata.",
  },
];

interface DifficultyPickerProps {
  selected: Difficulty | null;
  onSelect: (d: Difficulty) => void;
}

export function DifficultyPicker({ selected, onSelect }: DifficultyPickerProps) {
  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {OPTIONS.map((opt, i) => (
        <motion.button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className={clsx(
            "flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-colors",
            selected === opt.id
              ? "border-gold bg-gold/10 shadow-glow"
              : "border-void-line bg-void-raised hover:border-gold/40"
          )}
        >
          <span className="font-display text-xl text-parchment">{opt.name}</span>
          <span className="text-xs font-medium text-gold-bright sm:text-sm">{opt.tagline}</span>
          <span className="text-xs leading-relaxed text-parchment/60 sm:text-sm">{opt.detail}</span>
        </motion.button>
      ))}
    </div>
  );
}
