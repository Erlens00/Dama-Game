"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Difficulty, GameStats, GameStatus } from "@/lib/game/types";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
  extreme: "Extremo",
};

interface ResultModalProps {
  status: GameStatus;
  stats: GameStats;
  difficulty: Difficulty;
  durationMs: number;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
  onGoHome: () => void;
}

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ResultModal({
  status,
  stats,
  difficulty,
  durationMs,
  onPlayAgain,
  onChangeDifficulty,
  onGoHome,
}: ResultModalProps) {
  const open = status === "player-won" || status === "ai-won" || status === "draw";
  const fired = useRef(false);

  useEffect(() => {
    if (status === "player-won" && !fired.current) {
      fired.current = true;
      const colors = ["#C9A24B", "#E6C878", "#C84B36", "#E9DDC3"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 }, colors }), 250);
    }
    if (!open) fired.current = false;
  }, [status, open]);

  const title = status === "player-won" ? "¡VICTORIA!" : status === "ai-won" ? "DERROTA" : "EMPATE";
  const subtitle =
    status === "player-won"
      ? "Has vencido a la IA."
      : status === "ai-won"
        ? "La IA ha ganado esta partida."
        : "Ambos jugadores se han quedado con una sola ficha.";

  return (
    <Modal open={open}>
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        <div>
          <p
            className="font-display text-4xl font-bold"
            style={{
              color: status === "player-won" ? "#E6C878" : status === "ai-won" ? "#E8623F" : "#E9DDC3",
            }}
          >
            {title}
          </p>
          <p className="mt-2 text-sm text-parchment/60">{subtitle}</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 rounded-xl border border-void-line bg-void/40 p-4 text-sm">
          <Stat label="Movimientos" value={stats.moveCount} />
          <Stat label="Capturas" value={stats.captureCount} />
          <Stat label="Reyes obtenidos" value={stats.kingsCreated} />
          <Stat label="Combo máximo" value={stats.maxCombo} />
          <Stat label="Tiempo" value={formatTime(durationMs)} />
          <Stat label="Dificultad" value={DIFFICULTY_LABEL[difficulty]} />
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button variant="primary" size="lg" className="w-full" onClick={onPlayAgain}>
            Jugar nuevamente
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onChangeDifficulty}>
              Cambiar dificultad
            </Button>
            <Button variant="ghost" className="flex-1" onClick={onGoHome}>
              Volver al menú
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-semibold text-parchment">{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-parchment/40">{label}</span>
    </div>
  );
}
