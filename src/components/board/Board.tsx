"use client";

import { AnimatePresence } from "framer-motion";
import { GAME_CONFIG, isDarkSquare } from "@/lib/game/config";
import { Square } from "./Square";
import { PieceView } from "./PieceView";
import { BlockedMark } from "./BlockedMark";
import type { Board as BoardType, PlayerColor, Position } from "@/lib/game/types";

export interface BoardMoveOption {
  to: Position;
  isCapture: boolean;
}

interface BoardProps {
  board: BoardType;
  selectedPieceId: string | null;
  selectablePieceIds: string[];
  moveOptions: BoardMoveOption[];
  onSelectPiece: (pieceId: string) => void;
  onMoveTo: (pos: Position) => void;
  onEmptyClick: () => void;
  disabled?: boolean;
  /** Color que controla la persona frente a esta pantalla. Por defecto, el color del jugador local (modo vs. IA). */
  myColor?: PlayerColor;
  /** Voltea visualmente el tablero (para que el jugador de rojo también vea sus fichas abajo). */
  flip?: boolean;
}

function same(a: Position, b: Position) {
  return a.row === b.row && a.col === b.col;
}

export function Board({
  board,
  selectedPieceId,
  selectablePieceIds,
  moveOptions,
  onSelectPiece,
  onMoveTo,
  onEmptyClick,
  disabled,
  myColor = GAME_CONFIG.humanColor,
  flip = false,
}: BoardProps) {
  const size = GAME_CONFIG.boardSize;
  const cellPct = 100 / size;

  // Fila 7 (tablero interno) se dibuja arriba, fila 0 abajo, salvo que `flip`
  // esté activo (para el jugador de rojo en una partida online), en cuyo
  // caso se invierten ambos ejes para que cada quien vea sus fichas abajo.
  const visualRowIndex = (row: number) => (flip ? row : size - 1 - row);
  const visualColIndex = (col: number) => (flip ? size - 1 - col : col);
  const visualRows = Array.from({ length: size }, (_, i) => (flip ? i : size - 1 - i));

  const allCells = board.flat().filter((p): p is NonNullable<typeof p> => p !== null);
  const pieces = allCells.filter((p) => p.type !== "blocked");
  const blockedCells = allCells.filter((p) => p.type === "blocked");

  function handleSquareClick(pos: Position) {
    if (disabled) return;
    const piece = board[pos.row][pos.col];
    if (piece && piece.type !== "blocked" && piece.color === myColor) {
      onSelectPiece(piece.id);
      return;
    }
    if (selectedPieceId) {
      onMoveTo(pos);
      return;
    }
    onEmptyClick();
  }

  return (
    <div
      className="relative mx-auto aspect-square w-full select-none overflow-hidden rounded-2xl border-4 border-walnut-light bg-walnut shadow-panel"
      style={{
        maxWidth: "min(92vw, 62dvh, 560px)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.4)",
      }}
    >
      {/* Casillas */}
      {visualRows.map((row) =>
        Array.from({ length: size }, (_, col) => {
          const pos = { row, col };
          const dark = isDarkSquare(row, col);
          const isHop = moveOptions.some((o) => same(o.to, pos));
          const isCapture = moveOptions.some((o) => same(o.to, pos) && o.isCapture);
          return (
            <div
              key={`${row}-${col}`}
              className="absolute"
              style={{
                width: `${cellPct}%`,
                height: `${cellPct}%`,
                left: `${visualColIndex(col) * cellPct}%`,
                top: `${visualRowIndex(row) * cellPct}%`,
              }}
            >
              <Square
                row={row}
                col={col}
                dark={dark}
                isHopTarget={isHop}
                isCaptureTarget={isCapture}
                onClick={() => handleSquareClick(pos)}
              />
            </div>
          );
        })
      )}

      {/* Casillas bloqueadas (fase de solo-reyes) */}
      <AnimatePresence>
        {blockedCells.map((cell) => {
          return (
            <BlockedMark
              key={cell.id}
              style={{
                width: `${cellPct}%`,
                height: `${cellPct}%`,
                left: `${visualColIndex(cell.position.col) * cellPct}%`,
                top: `${visualRowIndex(cell.position.row) * cellPct}%`,
              }}
            />
          );
        })}
      </AnimatePresence>

      {/* Fichas */}
      <AnimatePresence>
        {pieces.map((piece) => {
          return (
            <PieceView
              key={piece.id}
              piece={piece}
              selectable={!disabled && selectablePieceIds.includes(piece.id)}
              selected={selectedPieceId === piece.id}
              onClick={() => handleSquareClick(piece.position)}
              style={{
                width: `${cellPct}%`,
                height: `${cellPct}%`,
                left: `${visualColIndex(piece.position.col) * cellPct}%`,
                top: `${visualRowIndex(piece.position.row) * cellPct}%`,
                transition: "left 0.28s cubic-bezier(0.4,0,0.2,1), top 0.28s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
