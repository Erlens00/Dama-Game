import type { Difficulty } from "../game/types";

export interface PersistedStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalCaptures: number;
  totalKings: number;
  bestTimeMs: number | null;
  currentStreak: number;
  bestStreak: number;
  hardestDifficultyBeaten: Difficulty | null;
}

const STORAGE_KEY = "dama-ai:stats";

export const DEFAULT_STATS: PersistedStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  totalCaptures: 0,
  totalKings: 0,
  bestTimeMs: null,
  currentStreak: 0,
  bestStreak: 0,
  hardestDifficultyBeaten: null,
};

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3, extreme: 4 };

export function loadStats(): PersistedStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...(JSON.parse(raw) as Partial<PersistedStats>) };
  } catch {
    return DEFAULT_STATS;
  }
}

function persist(stats: PersistedStats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export interface GameOutcome {
  result: "win" | "loss" | "draw";
  difficulty: Difficulty;
  captures: number;
  kingsCreated: number;
  durationMs: number;
}

export function recordGameOutcome(outcome: GameOutcome): PersistedStats {
  const stats = loadStats();
  stats.gamesPlayed += 1;
  stats.totalCaptures += outcome.captures;
  stats.totalKings += outcome.kingsCreated;

  if (outcome.result === "win") {
    stats.wins += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    if (stats.bestTimeMs === null || outcome.durationMs < stats.bestTimeMs) {
      stats.bestTimeMs = outcome.durationMs;
    }
    const currentRank = stats.hardestDifficultyBeaten ? DIFFICULTY_RANK[stats.hardestDifficultyBeaten] : 0;
    if (DIFFICULTY_RANK[outcome.difficulty] > currentRank) {
      stats.hardestDifficultyBeaten = outcome.difficulty;
    }
  } else if (outcome.result === "loss") {
    stats.losses += 1;
    stats.currentStreak = 0;
  } else {
    stats.draws += 1;
    stats.currentStreak = 0;
  }

  persist(stats);
  return stats;
}

export function resetStats(): PersistedStats {
  persist(DEFAULT_STATS);
  return DEFAULT_STATS;
}
