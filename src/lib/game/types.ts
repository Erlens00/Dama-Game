/**
 * Tipos centrales del motor de juego.
 * Este módulo NO depende de React ni de nada visual: es la única fuente
 * de verdad sobre la forma de los datos del juego, para que la misma
 * lógica pueda ejecutarse en el cliente, en un futuro servidor, o dentro
 * de la IA sin ninguna modificación.
 */

export type PlayerColor = "black" | "red";
export type PieceType = "normal" | "king" | "blocked";
export type Difficulty = "easy" | "medium" | "hard" | "extreme";

export type GameStatus =
  | "idle"
  | "player-turn"
  | "ai-turn"
  | "player-won"
  | "ai-won"
  | "draw";

/** Posición interna. col: 0-7 (A-H). row: 0-7 (1-8). */
export interface Position {
  col: number;
  row: number;
}

export interface Piece {
  id: string;
  color: PlayerColor;
  /** "blocked" representa una casilla marcada con X (fase de solo-reyes): no es una ficha real. */
  type: PieceType;
  position: Position;
}

/** El tablero se indexa como board[row][col]. */
export type Board = (Piece | null)[][];

/** Un único "salto" dentro de una jugada (puede ser simple o de captura). */
export interface MoveStep {
  from: Position;
  to: Position;
  capturedId: string | null;
  capturedPosition: Position | null;
}

/**
 * Una jugada completa tal como la ejecuta el motor: puede ser un
 * movimiento simple (un solo step), una cadena de capturas completa, o
 * (solo para reyes) una parada intermedia elegida dentro de un combo.
 */
export interface Move {
  pieceId: string;
  steps: MoveStep[];
  isCapture: boolean;
  promotesAt: Position | null;
}

export interface GameStats {
  moveCount: number;
  captureCount: number;
  kingsCreated: number;
  maxCombo: number;
}

export interface GameState {
  board: Board;
  turn: PlayerColor;
  status: GameStatus;
  difficulty: Difficulty;
  winner: PlayerColor | null;
  stats: GameStats;
  startedAt: number | null;
  endedAt: number | null;
  comboCount: number;
  lastMove: Move | null;
  /** true cuando ambos bandos se quedaron solo con reyes: activa la marca de casillas con X. */
  endgameLockdown: boolean;
}

export interface LegalMoveSet {
  /** Movimientos legales agrupados por id de ficha. Cada Move es una jugada completa y directamente ejecutable. */
  byPiece: Map<string, Move[]>;
  /** true si existe al menos una captura disponible para el jugador (informativo; ya NO es obligatorio capturar). */
  captureAvailable: boolean;
}
