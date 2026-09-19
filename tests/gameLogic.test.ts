import { describe, expect, it } from "vitest";
import { createEmptyBoard, isAllKingsEndgame, setPieceAt } from "@/lib/game/board";
import {
  getCaptureChains,
  getCaptureOptions,
  getLegalMovesForPiece,
  getSimpleMovesForPiece,
} from "@/lib/game/moveValidator";
import { checkPieceCountEnd } from "@/lib/game/winConditions";
import type { Board, Piece } from "@/lib/game/types";

function piece(id: string, color: "black" | "red", type: "normal" | "king", row: number, col: number): Piece {
  return { id, color, type, position: { row, col } };
}

function place(board: Board, p: Piece) {
  setPieceAt(board, p.position, p);
}

describe("movimiento normal", () => {
  it("una ficha negra normal puede avanzar en diagonal hacia adelante", () => {
    const board = createEmptyBoard();
    const p = piece("b1", "black", "normal", 2, 3);
    place(board, p);
    const moves = getSimpleMovesForPiece(board, p);
    const targets = moves.map((m) => m.steps[0].to);
    expect(targets).toContainEqual({ row: 3, col: 2 });
    expect(targets).toContainEqual({ row: 3, col: 4 });
    expect(moves).toHaveLength(2);
  });

  it("una ficha normal NO puede retroceder", () => {
    const board = createEmptyBoard();
    const p = piece("b1", "black", "normal", 2, 3);
    place(board, p);
    const targets = getSimpleMovesForPiece(board, p).map((m) => m.steps[0].to);
    expect(targets).not.toContainEqual({ row: 1, col: 2 });
    expect(targets).not.toContainEqual({ row: 1, col: 4 });
  });
});

describe("capturas de fichas normales", () => {
  it("una ficha puede capturar a un enemigo adyacente si el aterrizaje está libre", () => {
    const board = createEmptyBoard();
    const black = piece("b1", "black", "normal", 2, 3);
    const red = piece("r1", "red", "normal", 3, 4);
    place(board, black);
    place(board, red);
    const chains = getCaptureChains(board, black);
    expect(chains).toHaveLength(1);
    expect(chains[0].steps[0].to).toEqual({ row: 4, col: 5 });
    expect(chains[0].steps[0].capturedId).toBe("r1");
  });

  it("no existe captura si la casilla de aterrizaje está ocupada", () => {
    const board = createEmptyBoard();
    const black = piece("b1", "black", "normal", 2, 3);
    const red = piece("r1", "red", "normal", 3, 4);
    const blocker = piece("b2", "black", "normal", 4, 5);
    place(board, black);
    place(board, red);
    place(board, blocker);
    expect(getCaptureChains(board, black)).toHaveLength(0);
  });

  it("una ficha normal no puede capturar hacia atrás", () => {
    const board = createEmptyBoard();
    const black = piece("b1", "black", "normal", 3, 3);
    const red = piece("r1", "red", "normal", 2, 2);
    place(board, black);
    place(board, red);
    expect(getCaptureChains(board, black)).toHaveLength(0);
  });

  it("una ficha normal encadena varias capturas y ahora también puede elegir detenerse a mitad del combo", () => {
    const board = createEmptyBoard();
    const black = piece("b1", "black", "normal", 1, 1);
    const r1 = piece("r1", "red", "normal", 2, 2);
    const r2 = piece("r2", "red", "normal", 4, 4);
    place(board, black);
    place(board, r1);
    place(board, r2);
    const options = getCaptureOptions(board, black);
    const doubleCapture = options.find((c) => c.steps.length === 2);
    expect(doubleCapture).toBeDefined();
    expect(doubleCapture!.steps.map((s) => s.capturedId)).toEqual(["r1", "r2"]);
    // Ahora SÍ debe existir la opción de detenerse en la casilla intermedia (3,3), tras solo la 1ra captura.
    const stopsAtIntermediate = options.some(
      (c) => c.steps.length === 1 && c.steps[0].to.row === 3 && c.steps[0].to.col === 3
    );
    expect(stopsAtIntermediate).toBe(true);
  });

  it("a diferencia del rey, una ficha normal nunca se desliza más allá del aterrizaje fijo tras capturar", () => {
    const board = createEmptyBoard();
    const black = piece("b1", "black", "normal", 2, 2);
    const red = piece("r1", "red", "normal", 3, 3); // aterrizaje fijo en (4,4), y (5,5)/(6,6) están libres
    place(board, black);
    place(board, red);
    const options = getCaptureOptions(board, black);
    expect(options).toHaveLength(1); // solo el aterrizaje fijo, nada de deslizamiento
    expect(options[0].steps[0].to).toEqual({ row: 4, col: 4 });
  });

  it("comer ya no es obligatorio: una ficha con captura disponible también puede moverse normalmente", () => {
    const board = createEmptyBoard();
    const black = piece("b1", "black", "normal", 2, 3);
    const red = piece("r1", "red", "normal", 3, 4);
    place(board, black);
    place(board, red);
    const moves = getLegalMovesForPiece(board, black);
    const hasCapture = moves.some((m) => m.isCapture);
    const hasSimple = moves.some((m) => !m.isCapture);
    expect(hasCapture).toBe(true);
    expect(hasSimple).toBe(true);
  });
});

describe("capturas de reyes (captura 'al vuelo': no hace falta estar pegado a la pieza)", () => {
  it("un rey SÍ puede capturar a un enemigo lejano si el camino hasta él está vacío", () => {
    const board = createEmptyBoard();
    const king = piece("bk", "black", "king", 2, 2);
    const farEnemy = piece("r1", "red", "normal", 5, 5); // a 3 casillas, con el camino libre
    place(board, king);
    place(board, farEnemy);
    const options = getCaptureOptions(board, king);
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.steps[0].capturedId === "r1")).toBe(true);
  });

  it("un rey NO puede capturar si hay una ficha propia (u otro obstáculo) en el camino", () => {
    const board = createEmptyBoard();
    const king = piece("bk", "black", "king", 2, 2);
    const ownBlocker = piece("b2", "black", "normal", 3, 3);
    const farEnemy = piece("r1", "red", "normal", 5, 5);
    place(board, king);
    place(board, ownBlocker);
    place(board, farEnemy);
    expect(getCaptureOptions(board, king)).toHaveLength(0);
  });

  it("un rey captura a un enemigo adyacente con aterrizaje fijo a un espacio de distancia", () => {
    const board = createEmptyBoard();
    const king = piece("bk", "black", "king", 2, 2);
    const enemy = piece("r1", "red", "normal", 3, 3);
    place(board, king);
    place(board, enemy);
    const options = getCaptureOptions(board, king);
    const fixedLanding = options.find((o) => o.steps.length === 1 && o.steps[0].to.row === 4 && o.steps[0].to.col === 4);
    expect(fixedLanding).toBeDefined();
  });

  it("tras la última captura del combo, el rey puede elegir deslizarse más lejos (aterrizaje libre)", () => {
    const board = createEmptyBoard();
    const king = piece("bk", "black", "king", 2, 2);
    const enemy = piece("r1", "red", "normal", 3, 3);
    place(board, king);
    place(board, enemy);
    const options = getCaptureOptions(board, king);
    // Además del aterrizaje fijo en (4,4), debe poder deslizarse hasta (5,5), (6,6), (7,7).
    const farLanding = options.find((o) => o.steps[0].to.row === 6 && o.steps[0].to.col === 6);
    expect(farLanding).toBeDefined();
    expect(farLanding!.steps[0].capturedId).toBe("r1");
  });

  it("el rey puede elegir detenerse tras la primera captura de un combo, sin encadenar la segunda", () => {
    const board = createEmptyBoard();
    const king = piece("bk", "black", "king", 1, 1);
    const r1 = piece("r1", "red", "normal", 2, 2); // capturable en diagonal
    const r2 = piece("r2", "red", "normal", 4, 4); // seguiría siendo capturable si el rey continúa
    place(board, king);
    place(board, r1);
    place(board, r2);
    const options = getCaptureOptions(board, king);
    const stopAfterFirst = options.find((o) => o.steps.length === 1 && o.steps[0].capturedId === "r1");
    const continueToSecond = options.some((o) => o.steps.length === 2 && o.steps[1].capturedId === "r2");
    expect(stopAfterFirst).toBeDefined();
    expect(continueToSecond).toBe(true);
  });
});

describe("condiciones de victoria (deben capturarse TODAS las fichas)", () => {
  it("gana el jugador cuando la IA se queda sin ninguna ficha", () => {
    const board = createEmptyBoard();
    place(board, piece("b1", "black", "normal", 2, 2));
    const result = checkPieceCountEnd(board);
    expect(result).toEqual({ kind: "winner", winner: "black", reason: "no-pieces" });
  });

  it("ya NO hay victoria especial por 'única ficha restante': con 1 contra 1 la partida sigue", () => {
    const board = createEmptyBoard();
    place(board, piece("b1", "black", "king", 2, 2));
    place(board, piece("r1", "red", "king", 5, 5));
    expect(checkPieceCountEnd(board)).toBeNull();
  });

  it("con 1 rey contra varias fichas, la partida también sigue (ya no hay regla especial)", () => {
    const board = createEmptyBoard();
    place(board, piece("b1", "black", "normal", 2, 2));
    place(board, piece("b2", "black", "normal", 2, 4));
    place(board, piece("r1", "red", "king", 5, 5));
    expect(checkPieceCountEnd(board)).toBeNull();
  });
});

describe("mecánica de solo-reyes", () => {
  it("isAllKingsEndgame es true solo cuando ambos bandos tienen fichas y todas son reyes", () => {
    const board = createEmptyBoard();
    place(board, piece("b1", "black", "king", 2, 2));
    place(board, piece("r1", "red", "king", 5, 5));
    expect(isAllKingsEndgame(board)).toBe(true);
  });

  it("isAllKingsEndgame es false si algún bando todavía tiene una ficha normal", () => {
    const board = createEmptyBoard();
    place(board, piece("b1", "black", "king", 2, 2));
    place(board, piece("r1", "red", "normal", 5, 5));
    expect(isAllKingsEndgame(board)).toBe(false);
  });
});
