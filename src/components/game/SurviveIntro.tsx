"use client";

import { AnimatePresence, motion } from "framer-motion";

interface SurviveIntroProps {
  countdown: number | null;
}

export function SurviveIntro({ countdown }: SurviveIntroProps) {
  const open = countdown !== null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-void/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ember-bright">
              Solo quedan reyes
            </span>
            <h2 className="font-display text-5xl font-bold text-gold-bright drop-shadow-[0_2px_12px_rgba(201,162,75,0.5)] sm:text-6xl">
              ¡SOBREVIVE!
            </h2>
            <p className="max-w-xs text-sm text-parchment/60">
              Cada casilla que desocupes quedará marcada con una X y bloqueada para siempre. No podrás volver a
              pisarla ni te podrán capturar desde ahí.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {countdown !== null && countdown > 0 && (
              <motion.div
                key={countdown}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{ type: "spring", stiffness: 400, damping: 16 }}
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-gold/60 font-display text-4xl font-bold text-parchment shadow-glow"
              >
                {countdown}
              </motion.div>
            )}
            {countdown === 0 && (
              <motion.div
                key="go"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                className="font-display text-3xl font-bold text-ember-bright"
              >
                ¡YA!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
