import type { PlayerColor } from "./types";

/**
 * Configuración central del juego. Cambiar estos valores modifica el
 * comportamiento global sin tocar la lógica de validación.
 */
export const GAME_CONFIG = {
  boardSize: 8,
  humanColor: "black" as PlayerColor,
  aiColor: "red" as PlayerColor,
  gameName: "Dama AI",

  /**
   * Dirección de avance de cada bando, expresada como delta de fila.
   * Black avanza hacia filas de índice mayor (arriba), Red hacia filas
   * de índice menor (abajo). Cambiar esto invierte el tablero sin tocar
   * el resto de la lógica.
   */
  forwardDirection: {
    black: 1,
    red: -1,
  } as Record<PlayerColor, 1 | -1>,

  /** Filas iniciales (índices 0-7) ocupadas por cada bando. */
  initialRows: {
    black: [0, 1, 2],
    red: [5, 6, 7],
  } as Record<PlayerColor, number[]>,

  /**
   * Comer ya NO es obligatorio: el jugador siempre puede elegir un
   * movimiento simple aunque tenga una captura disponible.
   */
  mandatoryCapture: false,
} as const;

export const OPPONENT: Record<PlayerColor, PlayerColor> = {
  black: "red",
  red: "black",
};

export function colToLetter(col: number): string {
  return String.fromCharCode("A".charCodeAt(0) + col);
}

export function positionLabel(pos: { col: number; row: number }): string {
  return `${colToLetter(pos.col)}${pos.row + 1}`;
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < GAME_CONFIG.boardSize && col >= 0 && col < GAME_CONFIG.boardSize;
}

export function isDarkSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1;
}
