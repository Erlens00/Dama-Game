import type { Board, GameStats, Move, PlayerColor } from "@/lib/game/types";

export interface PublicProfile {
  name: string;
  country: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    currentStreak: number;
    bestStreak: number;
  };
}

export interface AuthResponse {
  ok: boolean;
  error?: string;
  token?: string;
  profile?: PublicProfile;
}

export interface RoomPlayerView {
  socketId: string;
  name: string;
  country: string;
  streak: number;
  bestStreak: number;
  color: PlayerColor | null;
  ready: boolean;
}

export interface ChatMessageView {
  name: string;
  text: string;
  ts: number;
}

export type RoomStatus = "waiting" | "playing" | "finished";

export interface RoomView {
  id: string;
  isPublic: boolean;
  hasPassword: boolean;
  hostSocketId: string;
  players: RoomPlayerView[];
  chat: ChatMessageView[];
  status: RoomStatus;
  board: Board;
  turn: PlayerColor;
  stats: GameStats;
  winner: PlayerColor | null;
  lastMove: Move | null;
  endgameLockdown: boolean;
  full: boolean;
}

export interface PublicRoomSummary {
  id: string;
  players: number;
  maxPlayers: number;
  full: boolean;
  status: RoomStatus;
  hostName: string;
}

export interface MoveOptionPreviewLike {
  to: { row: number; col: number };
  isCapture: boolean;
  captureCount: number;
}

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

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  updatedAt: number;
}
