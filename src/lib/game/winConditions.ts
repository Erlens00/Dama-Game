import { getAllPieces } from "./board";
import { playerHasAnyMove } from "./moveValidator";
import type { Board, PlayerColor } from "./types";

export type EndResult =
  | { kind: "winner"; winner: PlayerColor; reason: "no-pieces" | "no-moves" }
  | { kind: "draw"; reason: "no-pieces-both" }
  | null;

/**
 * Gana quien deja al rival sin ninguna ficha (deben capturarse TODAS,
 * incluyendo reyes). Ya no existe la regla de "una sola ficha restante".
 */
export function checkPieceCountEnd(board: Board): EndResult {
  const black = getAllPieces(board, "black").length;
  const red = getAllPieces(board, "red").length;

  if (red === 0 && black === 0) return { kind: "draw", reason: "no-pieces-both" };
  if (red === 0) return { kind: "winner", winner: "black", reason: "no-pieces" };
  if (black === 0) return { kind: "winner", winner: "red", reason: "no-pieces" };
  return null;
}

/**
 * Como comer ya no es obligatorio, quedarse sin movimientos legales es
 * la principal vía de "atasco" y por eso también es una forma válida de
 * ganar: si al jugador en turno no le queda ningún movimiento, pierde.
 * Esta es también la salida natural de la fase de solo-reyes con
 * casillas bloqueadas (sección de mecánica de endgame).
 */
export function checkNoMovesEnd(board: Board, colorToMove: PlayerColor): EndResult {
  if (playerHasAnyMove(board, colorToMove)) return null;
  const winner: PlayerColor = colorToMove === "black" ? "red" : "black";
  return { kind: "winner", winner, reason: "no-moves" };
}

export function evaluateGameEnd(board: Board, colorToMove: PlayerColor): EndResult {
  const byCount = checkPieceCountEnd(board);
  if (byCount) return byCount;
  return checkNoMovesEnd(board, colorToMove);
}
