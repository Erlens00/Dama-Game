import { OPPONENT } from "../game/config";
import { cloneBoard, findPieceById, isLastRowForColor, setPieceAt } from "../game/board";
import { getLegalMoveSet } from "../game/moveValidator";
import { evaluateBoard } from "./evaluate";
import type { Board, Move, Piece, PieceType, PlayerColor } from "../game/types";

/** Aplica una jugada completa (simple o cadena de capturas) sobre una COPIA del tablero. */
export function applyMoveToBoard(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const found = findPieceById(newBoard, move.pieceId);
  if (!found) return newBoard;
  let piece: Piece = found;

  for (const step of move.steps) {
    setPieceAt(newBoard, step.from, null);
    if (step.capturedPosition) setPieceAt(newBoard, step.capturedPosition, null);

    let nextType: PieceType = piece.type;
    if (nextType === "normal" && isLastRowForColor(step.to.row, piece.color)) nextType = "king";

    piece = { ...piece, type: nextType, position: step.to };
    setPieceAt(newBoard, step.to, piece);
  }

  return newBoard;
}

function flattenMoves(board: Board, color: PlayerColor): Move[] {
  const set = getLegalMoveSet(board, color);
  const moves: Move[] = [];
  for (const list of set.byPiece.values()) moves.push(...list);
  return moves;
}

/** Prioriza capturas (y cadenas más largas) para mejorar la poda alfa-beta. */
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    const aScore = a.isCapture ? a.steps.length + 1 : 0;
    const bScore = b.isCapture ? b.steps.length + 1 : 0;
    return bScore - aScore;
  });
}

const LOSS_SCORE = -1_000_000;

/**
 * Negamax con poda alfa-beta. Devuelve la puntuación desde la
 * perspectiva de `color` (el jugador a quien le toca mover en este nodo).
 */
export function negamax(board: Board, color: PlayerColor, depth: number, alpha: number, beta: number): number {
  const moves = flattenMoves(board, color);

  if (moves.length === 0) {
    // Sin movimientos legales: derrota para `color` en este nodo.
    return LOSS_SCORE - depth;
  }

  if (depth === 0) {
    return evaluateBoard(board, color);
  }

  let best = -Infinity;
  for (const move of orderMoves(moves)) {
    const child = applyMoveToBoard(board, move);
    const score = -negamax(child, OPPONENT[color], depth - 1, -beta, -alpha);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break; // poda
  }
  return best;
}

export interface ScoredMove {
  move: Move;
  score: number;
}

/** Evalúa cada movimiento raíz disponible para `color` y los devuelve ordenados de mejor a peor. */
export function searchRootMoves(board: Board, color: PlayerColor, depth: number): ScoredMove[] {
  const moves = orderMoves(flattenMoves(board, color));
  if (moves.length === 0) return [];

  let alpha = -Infinity;
  const beta = Infinity;
  const scored: ScoredMove[] = [];

  for (const move of moves) {
    const child = applyMoveToBoard(board, move);
    const score = -negamax(child, OPPONENT[color], depth - 1, -beta, -alpha);
    scored.push({ move, score });
    if (score > alpha) alpha = score;
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Búsqueda iterativa en profundidad ("iterative deepening"): repite la
 * búsqueda con profundidad 1, 2, 3... cediendo el hilo principal entre
 * cada nivel, hasta alcanzar `maxDepth` o agotar `timeBudgetMs`. Esto
 * evita congelar la interfaz en profundidades altas (dificultad Extremo)
 * y aprovecha cada milisegundo disponible para planificar más lejos.
 */
export async function searchRootMovesIterative(
  board: Board,
  color: PlayerColor,
  maxDepth: number,
  timeBudgetMs: number
): Promise<ScoredMove[]> {
  const start = Date.now();
  let best: ScoredMove[] = searchRootMoves(board, color, 1);

  for (let depth = 2; depth <= maxDepth; depth++) {
    if (Date.now() - start > timeBudgetMs) break;
    await new Promise((resolve) => setTimeout(resolve, 0)); // cede el hilo principal entre profundidades
    if (Date.now() - start > timeBudgetMs) break;
    best = searchRootMoves(board, color, depth);
  }

  return best;
}
