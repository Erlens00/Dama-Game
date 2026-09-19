import { cloneBoard, findPieceById, isLastRowForColor, setPieceAt } from "./board";
import type { Board, Move, Piece, PieceType } from "./types";

/**
 * Devuelve el tablero después de CADA paso de una jugada (en orden), a
 * partir de `board`. Se usa para animar visualmente un movimiento que
 * llegó ya completo desde el servidor (multijugador online), paso a
 * paso, en vez de que la ficha salte directo al destino final.
 */
export function getMoveSnapshots(board: Board, move: Move): Board[] {
  const snapshots: Board[] = [];
  let current = cloneBoard(board);
  const found = findPieceById(current, move.pieceId);
  if (!found) return [cloneBoard(board)];
  let piece: Piece = found;

  for (const step of move.steps) {
    const next = cloneBoard(current);
    setPieceAt(next, step.from, null);
    if (step.capturedPosition) setPieceAt(next, step.capturedPosition, null);

    let nextType: PieceType = piece.type;
    if (nextType === "normal" && isLastRowForColor(step.to.row, piece.color)) nextType = "king";

    piece = { ...piece, type: nextType, position: step.to };
    setPieceAt(next, step.to, piece);

    snapshots.push(next);
    current = next;
  }

  return snapshots.length > 0 ? snapshots : [cloneBoard(board)];
}
