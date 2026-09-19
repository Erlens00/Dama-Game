import { GAME_CONFIG, inBounds } from "./config";
import { cloneBoard, getAllPieces, getPieceAt, isLastRowForColor, setPieceAt } from "./board";
import type { Board, LegalMoveSet, Move, MoveStep, Piece, PlayerColor, Position } from "./types";

type Dir = [number, number];

const ALL_DIAGONALS: Dir[] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function forwardDiagonals(color: PlayerColor): Dir[] {
  const dr = GAME_CONFIG.forwardDirection[color];
  return [
    [dr, -1],
    [dr, 1],
  ];
}

/** Una casilla bloqueada (marcada con X) actúa como un muro: no se puede pisar ni atravesar. */
function isPassable(board: Board, pos: Position): boolean {
  if (!inBounds(pos.row, pos.col)) return false;
  return getPieceAt(board, pos) === null;
}

interface CaptureHop {
  landing: Position;
  capturedPosition: Position;
  capturedId: string;
  dir: Dir;
}

/** Movimientos simples (sin captura) de una ficha, respetando su tipo. Las casillas con X bloquean el paso. */
export function getSimpleMovesForPiece(board: Board, piece: Piece): Move[] {
  const moves: Move[] = [];
  const { row, col } = piece.position;

  if (piece.type === "normal") {
    for (const [dr, dc] of forwardDiagonals(piece.color)) {
      const to: Position = { row: row + dr, col: col + dc };
      if (!isPassable(board, to)) continue;
      moves.push(buildSimpleMove(piece, to));
    }
  } else if (piece.type === "king") {
    // Rey: movimiento "volador" mientras las casillas estén vacías y no bloqueadas.
    for (const [dr, dc] of ALL_DIAGONALS) {
      let i = 1;
      while (true) {
        const to: Position = { row: row + dr * i, col: col + dc * i };
        if (!isPassable(board, to)) break;
        moves.push(buildSimpleMove(piece, to));
        i += 1;
      }
    }
  }

  return moves;
}

/**
 * Un salto de captura. Las fichas normales solo capturan a un enemigo
 * adyacente (un espacio de diferencia). El REY captura "al vuelo": el
 * enemigo puede estar a cualquier distancia siempre que el camino hasta
 * él esté completamente vacío, y puede elegir CUALQUIER casilla vacía
 * más allá de esa ficha como aterrizaje (una opción por cada casilla
 * posible) — no necesita estar pegado a la pieza para comerla.
 */
function getCaptureHopsForPiece(board: Board, piece: Piece): CaptureHop[] {
  const hops: CaptureHop[] = [];
  const { row, col } = piece.position;

  if (piece.type === "king") {
    for (const [dr, dc] of ALL_DIAGONALS) {
      let i = 1;
      let enemy: Piece | null = null;
      let enemyPos: Position | null = null;

      // Avanza por casillas vacías hasta encontrar la primera ficha (o el borde).
      while (true) {
        const cur: Position = { row: row + dr * i, col: col + dc * i };
        if (!inBounds(cur.row, cur.col)) break;
        const occupant = getPieceAt(board, cur);
        if (!occupant) {
          i += 1;
          continue;
        }
        if (occupant.type !== "blocked" && occupant.color !== piece.color) {
          enemy = occupant;
          enemyPos = cur;
        }
        break; // primera ficha encontrada (propia, bloqueada, o enemiga): la búsqueda en esta dirección termina aquí
      }

      if (!enemy || !enemyPos) continue;

      // Cualquier casilla vacía inmediatamente después del enemigo es un aterrizaje válido.
      let j = i + 1;
      while (true) {
        const landing: Position = { row: row + dr * j, col: col + dc * j };
        if (!isPassable(board, landing)) break;
        hops.push({ landing, capturedPosition: enemyPos, capturedId: enemy.id, dir: [dr, dc] });
        j += 1;
      }
    }
    return hops;
  }

  // Ficha normal: captura de un solo espacio, siempre hacia adelante.
  for (const [dr, dc] of forwardDiagonals(piece.color)) {
    const adj: Position = { row: row + dr, col: col + dc };
    if (!inBounds(adj.row, adj.col)) continue;
    const enemy = getPieceAt(board, adj);
    if (!enemy || enemy.type === "blocked" || enemy.color === piece.color) continue;
    const landing: Position = { row: row + dr * 2, col: col + dc * 2 };
    if (!isPassable(board, landing)) continue; // aterrizaje ocupado, bloqueado o fuera del tablero
    hops.push({ landing, capturedPosition: adj, capturedId: enemy.id, dir: [dr, dc] });
  }

  return hops;
}

function buildSimpleMove(piece: Piece, to: Position): Move {
  const promotes = piece.type === "normal" && isLastRowForColor(to.row, piece.color);
  return {
    pieceId: piece.id,
    isCapture: false,
    promotesAt: promotes ? to : null,
    steps: [{ from: piece.position, to, capturedId: null, capturedPosition: null }],
  };
}

function buildMoveFromSteps(originalPiece: Piece, steps: MoveStep[]): Move {
  let promotesAt: Position | null = null;
  let wasNormal = originalPiece.type === "normal";
  for (const step of steps) {
    if (wasNormal && isLastRowForColor(step.to.row, originalPiece.color)) {
      promotesAt = step.to;
      wasNormal = false;
    }
  }
  return { pieceId: originalPiece.id, isCapture: steps.length > 0, promotesAt, steps };
}

/**
 * Cadenas de captura COMPLETAS (máximas) de una ficha, sin ninguna
 * parada intermedia. Se usa solo como referencia interna / pruebas; el
 * conjunto de jugadas legales real es `getCaptureOptions`, que además
 * incluye las paradas voluntarias.
 */
export function getCaptureChains(board: Board, piece: Piece): Move[] {
  const results: Move[] = [];

  function dfs(currentBoard: Board, currentPiece: Piece, stepsSoFar: MoveStep[]) {
    const hops = getCaptureHopsForPiece(currentBoard, currentPiece);

    if (hops.length === 0) {
      if (stepsSoFar.length > 0) results.push(buildMoveFromSteps(piece, stepsSoFar));
      return;
    }

    for (const hop of hops) {
      const { nextBoard, nextPiece, step } = applyHop(currentBoard, currentPiece, hop);
      dfs(nextBoard, nextPiece, [...stepsSoFar, step]);
    }
  }

  dfs(board, piece, []);
  return results;
}

function applyHop(
  board: Board,
  piece: Piece,
  hop: CaptureHop
): { nextBoard: Board; nextPiece: Piece; step: MoveStep } {
  const nextBoard = cloneBoard(board);
  setPieceAt(nextBoard, piece.position, null);
  setPieceAt(nextBoard, hop.capturedPosition, null);

  let nextType = piece.type;
  if (nextType === "normal" && isLastRowForColor(hop.landing.row, piece.color)) {
    nextType = "king"; // coronación inmediata, incluso a mitad de combo
  }

  const nextPiece: Piece = { ...piece, type: nextType, position: hop.landing };
  setPieceAt(nextBoard, hop.landing, nextPiece);

  const step: MoveStep = {
    from: piece.position,
    to: hop.landing,
    capturedId: hop.capturedId,
    capturedPosition: hop.capturedPosition,
  };

  return { nextBoard, nextPiece, step };
}

/**
 * TODAS las opciones de captura de una ficha (normal o rey): en cada
 * punto del combo, después de cada captura, la ficha puede optar por
 * detenerse ahí mismo, o seguir capturando si aún puede. Comer es
 * opcional, y detenerse a mitad de un combo también lo es, para
 * cualquier tipo de ficha. Como el rey ya elige entre TODAS las
 * casillas de aterrizaje posibles en cada salto (captura "al vuelo"),
 * esto solo necesita registrar cada punto alcanzado del recorrido.
 */
export function getCaptureOptions(board: Board, piece: Piece): Move[] {
  const results: Move[] = [];

  function dfs(currentBoard: Board, currentPiece: Piece, stepsSoFar: MoveStep[]) {
    if (stepsSoFar.length > 0) {
      results.push(buildMoveFromSteps(piece, stepsSoFar));
    }

    const hops = getCaptureHopsForPiece(currentBoard, currentPiece);
    for (const hop of hops) {
      const { nextBoard, nextPiece, step } = applyHop(currentBoard, currentPiece, hop);
      dfs(nextBoard, nextPiece, [...stepsSoFar, step]);
    }
  }

  dfs(board, piece, []);
  return results;
}

/** Movimientos legales para UNA ficha concreta (comer es opcional: se incluyen ambas opciones). */
export function getLegalMovesForPiece(board: Board, piece: Piece): Move[] {
  const simples = getSimpleMovesForPiece(board, piece);
  const captures = getCaptureOptions(board, piece);
  return [...captures, ...simples];
}

/**
 * Calcula el conjunto completo de movimientos legales para un jugador.
 * Comer es opcional: cada ficha ofrece tanto sus movimientos simples
 * como (si existen) sus opciones de captura.
 */
export function getLegalMoveSet(board: Board, color: PlayerColor): LegalMoveSet {
  const pieces = getAllPieces(board, color);
  const byPiece = new Map<string, Move[]>();
  let captureAvailable = false;

  for (const piece of pieces) {
    const moves = getLegalMovesForPiece(board, piece);
    if (moves.some((m) => m.isCapture)) captureAvailable = true;
    if (moves.length > 0) byPiece.set(piece.id, moves);
  }

  return { byPiece, captureAvailable };
}

export function playerHasAnyMove(board: Board, color: PlayerColor): boolean {
  return getLegalMoveSet(board, color).byPiece.size > 0;
}
