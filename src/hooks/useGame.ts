"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameManager, type MoveOption } from "@/lib/game/gameManager";
import { computeAiMove, getThinkDelay } from "@/lib/ai/aiPlayer";
import { soundManager } from "@/lib/audio/soundManager";
import { loadSettings } from "@/lib/storage/settings";
import { recordGameOutcome } from "@/lib/storage/stats";
import type { Difficulty, GameState, Position } from "@/lib/game/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useGame(initialDifficulty: Difficulty) {
  const managerRef = useRef<GameManager | null>(null);
  if (!managerRef.current) managerRef.current = new GameManager(initialDifficulty);
  const manager = managerRef.current;

  const [state, setState] = useState<GameState>(manager.getState());
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Tu turno");
  const [surviveCountdown, setSurviveCountdown] = useState<number | null>(null);
  const statsRecorded = useRef(false);
  const wasLockdown = useRef(false);

  useEffect(() => {
    const settings = loadSettings();
    soundManager.setEnabled(settings.soundOn);
    soundManager.setVolume(settings.volume);
  }, []);

  useEffect(() => manager.subscribe(setState), [manager]);

  // Anuncio de "¡SOBREVIVE!" con cuenta regresiva de 3 segundos al activarse la fase de solo-reyes.
  useEffect(() => {
    if (state.endgameLockdown && !wasLockdown.current) {
      wasLockdown.current = true;
      soundManager.play("king");
      setSurviveCountdown(3);
    }
  }, [state.endgameLockdown]);

  useEffect(() => {
    if (surviveCountdown === null) return;
    if (surviveCountdown <= 0) {
      const t = setTimeout(() => setSurviveCountdown(null), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSurviveCountdown((c) => (c ?? 1) - 1), 900);
    return () => clearTimeout(t);
  }, [surviveCountdown]);

  // Mensajes contextuales.
  useEffect(() => {
    if (state.status === "player-turn") {
      setMessage(state.endgameLockdown ? "Tu turno · fase de reyes" : "Tu turno");
    } else if (state.status === "ai-turn") {
      setMessage("La IA está pensando...");
    } else if (state.status === "player-won") {
      setMessage("¡VICTORIA!");
    } else if (state.status === "ai-won") {
      setMessage("DERROTA");
    } else if (state.status === "draw") {
      setMessage("EMPATE");
    }
  }, [state.status, state.endgameLockdown]);

  // Sonido reactivo al último paso ejecutado (jugador o IA), incluidos los pasos intermedios de un combo.
  const lastMoveRef = useRef(state.lastMove);
  useEffect(() => {
    if (state.lastMove && state.lastMove !== lastMoveRef.current) {
      const steps = state.lastMove.steps;
      const latestStep = steps[steps.length - 1];
      const justPromoted =
        state.lastMove.promotesAt &&
        latestStep &&
        state.lastMove.promotesAt.row === latestStep.to.row &&
        state.lastMove.promotesAt.col === latestStep.to.col;

      if (justPromoted) soundManager.play("king");
      else if (latestStep?.capturedId) soundManager.play(steps.length > 1 ? "combo" : "capture");
      else soundManager.play("move");
    }
    lastMoveRef.current = state.lastMove;
  }, [state.lastMove]);

  // Registro de estadísticas + sonido de fin de partida (una sola vez por partida).
  useEffect(() => {
    if (statsRecorded.current) return;
    if (state.status === "player-won" || state.status === "ai-won" || state.status === "draw") {
      statsRecorded.current = true;
      const durationMs = state.startedAt && state.endedAt ? state.endedAt - state.startedAt : 0;
      const result = state.status === "player-won" ? "win" : state.status === "ai-won" ? "loss" : "draw";
      recordGameOutcome({
        result,
        difficulty: state.difficulty,
        captures: state.stats.captureCount,
        kingsCreated: state.stats.kingsCreated,
        durationMs,
      });
      soundManager.play(result === "win" ? "victory" : result === "loss" ? "defeat" : "draw");
    }
  }, [state.status, state.startedAt, state.endedAt, state.difficulty, state.stats]);

  // Turno de la IA: piensa un poco (real: profundidad de búsqueda) y ejecuta su jugada.
  useEffect(() => {
    if (state.status !== "ai-turn" || surviveCountdown !== null) return;
    let cancelled = false;

    (async () => {
      const delay = getThinkDelay(state.difficulty);
      await sleep(delay);
      if (cancelled) return;
      const move = await computeAiMove(manager.getState().board, state.difficulty);
      if (cancelled) return;
      if (move) await manager.applyAiMove(move);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.turn, state.difficulty, surviveCountdown]);

  const moveOptions: MoveOption[] = useMemo(() => {
    if (!selectedPieceId) return [];
    return manager.getMoveOptions(selectedPieceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPieceId, state]);

  const selectablePieceIds = useMemo(() => manager.getSelectablePieceIds(), [state]);

  const selectPiece = useCallback(
    (pieceId: string) => {
      if (state.status !== "player-turn" || manager.isBusy() || surviveCountdown !== null) return;
      if (!selectablePieceIds.includes(pieceId)) {
        soundManager.play("error");
        return;
      }
      setSelectedPieceId((current) => (current === pieceId ? null : pieceId));
      soundManager.play("select");
    },
    [state.status, selectablePieceIds, manager, surviveCountdown]
  );

  const clearSelection = useCallback(() => setSelectedPieceId(null), []);

  const moveTo = useCallback(
    async (to: Position) => {
      if (!selectedPieceId) return false;
      const ok = await manager.playMove(selectedPieceId, to);
      if (!ok) {
        soundManager.play("error");
        return false;
      }
      setSelectedPieceId(null);
      return true;
    },
    [selectedPieceId, manager]
  );

  const newGame = useCallback(
    (difficulty?: Difficulty) => {
      statsRecorded.current = false;
      wasLockdown.current = false;
      setSurviveCountdown(null);
      setSelectedPieceId(null);
      manager.newGame(difficulty);
    },
    [manager]
  );

  const setDifficulty = useCallback((difficulty: Difficulty) => manager.setDifficulty(difficulty), [manager]);

  return {
    state,
    message,
    selectedPieceId,
    moveOptions,
    selectablePieceIds,
    selectPiece,
    clearSelection,
    moveTo,
    newGame,
    setDifficulty,
    busy: manager.isBusy(),
    surviveCountdown,
  };
}
