"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ComboBadgeProps {
  combo: number;
}

export function ComboBadge({ combo }: ComboBadgeProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center">
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            key={combo}
            initial={{ opacity: 0, scale: 0.5, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -14 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="rounded-full bg-gradient-to-r from-ember to-gold px-6 py-2 font-display text-xl font-bold text-void shadow-glow"
          >
            COMBO ×{combo}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
