import { allUsers } from "./db";

export type LeaderboardCategory = "games" | "wins" | "streak";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  country: string;
  value: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  bestStreak: number;
}

const TOP_N = 100;
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface CacheEntry {
  computedAt: number;
  entries: LeaderboardEntry[];
}

const cache: Partial<Record<LeaderboardCategory, CacheEntry>> = {};

function computeCategory(category: LeaderboardCategory): LeaderboardEntry[] {
  const users = allUsers().filter((u) => u.stats.gamesPlayed > 0);

  const sortKey = (u: (typeof users)[number]) => {
    if (category === "games") return u.stats.gamesPlayed;
    if (category === "wins") return u.stats.wins;
    return u.stats.bestStreak;
  };

  const sorted = [...users].sort((a, b) => sortKey(b) - sortKey(a)).slice(0, TOP_N);

  return sorted.map((u, i) => ({
    rank: i + 1,
    name: u.displayName,
    country: u.country,
    value: sortKey(u),
    gamesPlayed: u.stats.gamesPlayed,
    wins: u.stats.wins,
    winRate: u.stats.gamesPlayed > 0 ? Math.round((u.stats.wins / u.stats.gamesPlayed) * 100) : 0,
    bestStreak: u.stats.bestStreak,
  }));
}

/** Devuelve el ranking, recalculándolo solo si la caché tiene más de 24 h (o no existe). */
export function getLeaderboard(category: LeaderboardCategory): { entries: LeaderboardEntry[]; updatedAt: number } {
  const cached = cache[category];
  if (cached && Date.now() - cached.computedAt < REFRESH_INTERVAL_MS) {
    return { entries: cached.entries, updatedAt: cached.computedAt };
  }
  const entries = computeCategory(category);
  const computedAt = Date.now();
  cache[category] = { computedAt, entries };
  return { entries, updatedAt: computedAt };
}

/** Fuerza un recálculo inmediato (se usa al cerrar una partida, para reflejar el resultado sin esperar 24h la primera vez). */
export function invalidateLeaderboardCache(): void {
  for (const key of Object.keys(cache) as LeaderboardCategory[]) delete cache[key];
}
