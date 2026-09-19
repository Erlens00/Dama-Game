"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Board } from "@/components/board/Board";
import { GameHUD } from "@/components/game/GameHUD";
import { ComboBadge } from "@/components/game/ComboBadge";
import { SurviveIntro } from "@/components/game/SurviveIntro";
import { ResultModal } from "@/components/game/ResultModal";
import { DifficultyPicker } from "@/components/game/DifficultyPicker";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/hooks/useGame";
import { loadSettings } from "@/lib/storage/settings";
import type { Difficulty } from "@/lib/game/types";

export default function PlayPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"difficulty" | "game">("difficulty");
  const [pickedDifficulty, setPickedDifficulty] = useState<Difficulty>("medium");
  const game = useGame("medium");

  function startGame(difficulty: Difficulty) {
    game.newGame(difficulty);
    setPhase("game");
  }

  function confirmQuit() {
    const settings = loadSettings();
    const isMidGame = game.state.status === "player-turn" || game.state.status === "ai-turn";
    if (isMidGame && settings.confirmBeforeLeaving) {
      if (!window.confirm("¿Abandonar la partida en curso?")) return;
    }
    router.push("/");
  }

  if (phase === "difficulty") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <h2 className="font-display text-3xl text-parchment">Elige la dificultad</h2>
          <p className="max-w-sm text-sm text-parchment/50">
            Cada nivel usa una búsqueda real (minimax con poda alfa-beta): cambia cuánto ve la IA por delante, no
            solo cuánto tarda.
          </p>
        </motion.div>

        <DifficultyPicker selected={pickedDifficulty} onSelect={setPickedDifficulty} />

        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button size="lg" className="w-full" onClick={() => startGame(pickedDifficulty)}>
            Comenzar partida
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/")}>
            Volver al menú
          </Button>
        </div>
      </div>
    );
  }

  const durationMs = game.state.startedAt && game.state.endedAt ? game.state.endedAt - game.state.startedAt : 0;

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-2 overflow-hidden px-3 py-2 sm:gap-4 sm:py-4">
      <ComboBadge combo={game.state.comboCount} />
      <SurviveIntro countdown={game.surviveCountdown} />

      <GameHUD
        message={game.message}
        status={game.state.status}
        difficulty={game.state.difficulty}
        startedAt={game.state.startedAt}
        captures={game.state.stats.captureCount}
        onQuit={confirmQuit}
      />

      <Board
        board={game.state.board}
        selectedPieceId={game.selectedPieceId}
        selectablePieceIds={game.selectablePieceIds}
        moveOptions={game.moveOptions}
        onSelectPiece={game.selectPiece}
        onMoveTo={game.moveTo}
        onEmptyClick={game.clearSelection}
        disabled={game.state.status !== "player-turn" || game.busy || game.surviveCountdown !== null}
      />

      <ResultModal
        status={game.state.status}
        stats={game.state.stats}
        difficulty={game.state.difficulty}
        durationMs={durationMs}
        onPlayAgain={() => game.newGame(game.state.difficulty)}
        onChangeDifficulty={() => setPhase("difficulty")}
        onGoHome={() => router.push("/")}
      />
    </div>
  );
}
