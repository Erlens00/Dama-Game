import type { Difficulty } from "../game/types";

export interface DifficultySettings {
  /** Profundidad MÁXIMA del minimax/alpha-beta (límite superior; la búsqueda iterativa puede detenerse antes por tiempo). */
  depth: number;
  /** Tiempo máximo (ms) que la IA puede usar pensando esta jugada, ampliando la profundidad mientras alcance. */
  timeBudgetMs: number;
  /** Probabilidad de ignorar la búsqueda y jugar un movimiento legal aleatorio (error deliberado). */
  blunderProbability: number;
  /** Margen de puntuación dentro del cual se elige aleatoriamente entre los mejores candidatos. 0 = siempre el mejor. */
  candidateMargin: number;
  /** Retraso artificial mínimo/máximo (ms) para que "pensando..." se sienta natural, sumado al tiempo real de búsqueda. */
  thinkDelayMs: [number, number];
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    depth: 2,
    timeBudgetMs: 200,
    blunderProbability: 0.35,
    candidateMargin: 140,
    thinkDelayMs: [350, 700],
  },
  medium: {
    depth: 4,
    timeBudgetMs: 500,
    blunderProbability: 0.12,
    candidateMargin: 60,
    thinkDelayMs: [450, 900],
  },
  hard: {
    depth: 7,
    timeBudgetMs: 1800,
    blunderProbability: 0.02,
    candidateMargin: 15,
    thinkDelayMs: [550, 1100],
  },
  /**
   * Extremo: nunca comete errores deliberados, siempre elige el mejor
   * movimiento encontrado (sin margen de aleatoriedad), y usa búsqueda
   * iterativa en profundidad con un presupuesto de tiempo generoso, por
   * lo que "planifica" varias jugadas por delante en vez de limitarse a
   * evaluar la posición inmediata.
   */
  extreme: {
    depth: 12,
    timeBudgetMs: 4500,
    blunderProbability: 0,
    candidateMargin: 0,
    thinkDelayMs: [500, 900],
  },
};
