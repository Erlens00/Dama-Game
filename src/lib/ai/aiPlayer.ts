import { GAME_CONFIG } from "../game/config";
import { getLegalMoveSet } from "../game/moveValidator";
import { DIFFICULTY_SETTINGS } from "./difficulty";
import { searchRootMovesIterative } from "./minimax";
import type { Board, Difficulty, Move } from "../game/types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Calcula la jugada de la IA. Cada dificultad utiliza el MISMO motor de
 * reglas (getLegalMoveSet) y el mismo buscador minimax/alpha-beta; lo que
 * cambia es la profundidad de búsqueda y la probabilidad de cometer un
 * error deliberado, nunca un simple retraso artificial.
 */
export async function computeAiMove(board: Board, difficulty: Difficulty): Promise<Move | null> {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const legalSet = getLegalMoveSet(board, GAME_CONFIG.aiColor);
  const allMoves: Move[] = [];
  for (const list of legalSet.byPiece.values()) allMoves.push(...list);

  if (allMoves.length === 0) return null;

  // Deja respirar al hilo principal antes de una búsqueda profunda.
  await new Promise((resolve) => setTimeout(resolve, 0));

  if (Math.random() < settings.blunderProbability) {
    return pickRandom(allMoves);
  }

  const scored = await searchRootMovesIterative(board, GAME_CONFIG.aiColor, settings.depth, settings.timeBudgetMs);
  if (scored.length === 0) return null;

  const bestScore = scored[0].score;
  const candidates = scored.filter((s) => s.score >= bestScore - settings.candidateMargin);
  return pickRandom(candidates).move;
}

/** Retraso artificial de "pensando..." puramente estético, acotado por dificultad. */
export function getThinkDelay(difficulty: Difficulty): number {
  const [min, max] = DIFFICULTY_SETTINGS[difficulty].thinkDelayMs;
  return randomInt(min, max);
}
