import { OPPONENT } from "../game/config";
import { getAllPieces } from "../game/board";
import { getLegalMoveSet } from "../game/moveValidator";
import type { Board, PlayerColor } from "../game/types";

const NORMAL_VALUE = 100;
const KING_VALUE = 175;
const MOBILITY_WEIGHT = 3;
const ADVANCEMENT_WEIGHT = 4;
const CAPTURE_THREAT_WEIGHT = 25;

/**
 * Evalúa el tablero desde la perspectiva de `color`. Un valor positivo
 * significa que `color` está mejor posicionado que su rival.
 */
export function evaluateBoard(board: Board, color: PlayerColor): number {
  const opponent = OPPONENT[color];
  let score = 0;

  for (const piece of getAllPieces(board)) {
    const sign = piece.color === color ? 1 : -1;
    const value = piece.type === "king" ? KING_VALUE : NORMAL_VALUE;
    score += sign * value;

    if (piece.type === "normal") {
      // Avance hacia la coronación: cuanto más cerca de la última fila, mejor.
      const progress = piece.color === "black" ? piece.position.row : 7 - piece.position.row;
      score += sign * progress * ADVANCEMENT_WEIGHT;
    } else {
      // Los reyes son más valiosos cerca del centro (mayor movilidad real).
      const centerDistance = Math.abs(piece.position.row - 3.5) + Math.abs(piece.position.col - 3.5);
      score += sign * (7 - centerDistance) * 1.5;
    }
  }

  const ownMoves = getLegalMoveSet(board, color);
  const oppMoves = getLegalMoveSet(board, opponent);
  score += (ownMoves.byPiece.size - oppMoves.byPiece.size) * MOBILITY_WEIGHT;

  if (ownMoves.captureAvailable) score += CAPTURE_THREAT_WEIGHT;
  if (oppMoves.captureAvailable) score -= CAPTURE_THREAT_WEIGHT;

  return score;
}
