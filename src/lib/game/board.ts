import { GAME_CONFIG, inBounds, isDarkSquare } from "./config";
import type { Board, Piece, PlayerColor, Position } from "./types";

let pieceIdCounter = 0;
function nextPieceId(color: PlayerColor): string {
  pieceIdCounter += 1;
  return `${color[0]}-${pieceIdCounter}-${Date.now().toString(36)}`;
}

export function createEmptyBoard(): Board {
  const size = GAME_CONFIG.boardSize;
  return Array.from({ length: size }, () => Array<Piece | null>(size).fill(null));
}

/** Crea el tablero inicial con la disposición estándar de damas (solo casillas oscuras). */
export function createInitialBoard(): Board {
  const board = createEmptyBoard();

  (["black", "red"] as PlayerColor[]).forEach((color) => {
    for (const row of GAME_CONFIG.initialRows[color]) {
      for (let col = 0; col < GAME_CONFIG.boardSize; col++) {
        if (!isDarkSquare(row, col)) continue;
        const piece: Piece = {
          id: nextPieceId(color),
          color,
          type: "normal",
          position: { row, col },
        };
        board[row][col] = piece;
      }
    }
  });

  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell, position: { ...cell.position } } : null)));
}

export function getPieceAt(board: Board, pos: Position): Piece | null {
  if (!inBounds(pos.row, pos.col)) return null;
  return board[pos.row][pos.col];
}

export function setPieceAt(board: Board, pos: Position, piece: Piece | null): void {
  board[pos.row][pos.col] = piece;
}

export function findPieceById(board: Board, id: string): Piece | null {
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.id === id) return cell;
    }
  }
  return null;
}

export function getAllPieces(board: Board, color?: PlayerColor): Piece[] {
  const pieces: Piece[] = [];
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type !== "blocked" && (!color || cell.color === color)) pieces.push(cell);
    }
  }
  return pieces;
}

let blockedIdCounter = 0;
/** Crea el marcador de "casilla con X" usado en la fase de solo-reyes (sección de reglas del endgame). */
export function createBlockedMarker(pos: Position): Piece {
  blockedIdCounter += 1;
  return { id: `blocked-${blockedIdCounter}`, color: "black", type: "blocked", position: pos };
}

export function isLastRowForColor(row: number, color: PlayerColor): boolean {
  const last = color === "black" ? GAME_CONFIG.boardSize - 1 : 0;
  return row === last;
}

/**
 * true cuando ambos bandos siguen en juego pero ya no les queda ninguna
 * ficha normal (solo reyes). Activa la mecánica de casillas bloqueadas
 * con X para evitar partidas interminables entre reyes.
 */
export function isAllKingsEndgame(board: Board): boolean {
  const black = getAllPieces(board, "black");
  const red = getAllPieces(board, "red");
  if (black.length === 0 || red.length === 0) return false;
  return black.every((p) => p.type === "king") && red.every((p) => p.type === "king");
}
