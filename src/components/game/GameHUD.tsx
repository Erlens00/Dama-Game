"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "@/lib/utils/clsx";
import type { Difficulty, GameStatus } from "@/lib/game/types";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
  extreme: "Extremo",
};

interface GameHUDProps {
  message: string;
  status: GameStatus;
  difficulty: Difficulty;
  startedAt: number | null;
  captures: number;
  onQuit: () => void;
}

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameHUD({ message, status, difficulty, startedAt, captures, onQuit }: GameHUDProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "player-turn" && status !== "ai-turn") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  const elapsed = startedAt ? now - startedAt : 0;
  const isAiTurn = status === "ai-turn";

  return (
    <div className="flex w-full max-w-[min(92vw,560px)] flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-parchment/60">
        <button onClick={onQuit} className="rounded-lg px-2 py-1 hover:bg-white/5 hover:text-parchment">
          ← Menú
        </button>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-void-line bg-void-raised px-3 py-1">
            IA · {DIFFICULTY_LABEL[difficulty]}
          </span>
          <span className="tabular-nums">{formatTime(elapsed)}</span>
          <span>Capturas: {captures}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <div
          className={clsx(
            "h-2.5 w-2.5 rounded-full",
            isAiTurn ? "bg-ember-bright animate-pulse-glow" : "bg-gold-bright animate-pulse-glow"
          )}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="font-display text-base text-parchment sm:text-lg"
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
