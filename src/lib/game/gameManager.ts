import { GAME_CONFIG, OPPONENT } from "./config";
import {
  cloneBoard,
  createBlockedMarker,
  createInitialBoard,
  findPieceById,
  isAllKingsEndgame,
  isLastRowForColor,
  setPieceAt,
} from "./board";
import { getLegalMoveSet, getLegalMovesForPiece } from "./moveValidator";
import { checkNoMovesEnd, checkPieceCountEnd, type EndResult } from "./winConditions";
import type { Board, Difficulty, GameState, Move, MoveStep, Piece, PlayerColor, Position } from "./types";

export interface MoveOption {
  to: Position;
  isCapture: boolean;
  captureCount: number;
  move: Move;
}

type Listener = (state: GameState) => void;

function samePos(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createInitialState(difficulty: Difficulty): GameState {
  return {
    board: createInitialBoard(),
    turn: "black",
    status: "player-turn",
    difficulty,
    winner: null,
    stats: { moveCount: 0, captureCount: 0, kingsCreated: 0, maxCombo: 0 },
    startedAt: Date.now(),
    endedAt: null,
    comboCount: 0,
    lastMove: null,
    endgameLockdown: false,
  };
}

export class GameManager {
  private board: Board;
  private state: GameState;
  private listeners: Set<Listener> = new Set();
  /** Evita ejecutar dos jugadas en simultáneo mientras una animación de combo está en curso. */
  private busy = false;

  constructor(difficulty: Difficulty = "medium") {
    const initial = createInitialState(difficulty);
    this.board = initial.board;
    this.state = initial;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): GameState {
    return this.state;
  }

  isBusy(): boolean {
    return this.busy;
  }

  private emit() {
    this.state = { ...this.state, board: cloneBoard(this.board) };
    for (const l of this.listeners) l(this.state);
  }

  newGame(difficulty?: Difficulty) {
    const initial = createInitialState(difficulty ?? this.state.difficulty);
    this.board = initial.board;
    this.state = initial;
    this.busy = false;
    this.emit();
  }

  setDifficulty(difficulty: Difficulty) {
    this.state = { ...this.state, difficulty };
    this.emit();
  }

  /**
   * Todas las jugadas completas y directamente ejecutables para una
   * ficha: movimientos simples y, si existen, TODAS las opciones de
   * captura (comer es opcional). Para un rey, cada punto donde podría
   * detenerse dentro de un combo aparece como una opción independiente.
   */
  getMoveOptions(pieceId: string): MoveOption[] {
    const piece = findPieceById(this.board, pieceId);
    if (!piece || piece.color !== this.state.turn) return [];
    const moves = getLegalMovesForPiece(this.board, piece);
    return moves.map((move) => ({
      to: move.steps[move.steps.length - 1].to,
      isCapture: move.isCapture,
      captureCount: move.steps.filter((s) => s.capturedId).length,
      move,
    }));
  }

  /** Ids de fichas que el jugador actual puede seleccionar en este momento. */
  getSelectablePieceIds(): string[] {
    return Array.from(getLegalMoveSet(this.board, this.state.turn).byPiece.keys());
  }

  private commitStep(piece: Piece, step: MoveStep): { updatedPiece: Piece; promoted: boolean } {
    setPieceAt(this.board, step.from, null);
    if (step.capturedPosition) setPieceAt(this.board, step.capturedPosition, null);

    let type = piece.type;
    let promoted = false;
    if (type === "normal" && isLastRowForColor(step.to.row, piece.color)) {
      type = "king";
      promoted = true;
    }

    const updatedPiece: Piece = { ...piece, type, position: step.to };
    setPieceAt(this.board, step.to, updatedPiece);
    return { updatedPiece, promoted };
  }

  /**
   * Ejecuta una jugada COMPLETA paso a paso, emitiendo el estado después
   * de cada salto individual (con una pequeña pausa) para que la ficha
   * se anime visualmente pasando por cada casilla intermedia del combo,
   * en vez de saltar directo al destino final.
   */
  private async executeMove(move: Move, stepDelayMs: number): Promise<void> {
    this.busy = true;
    let piece = findPieceById(this.board, move.pieceId);
    if (!piece) {
      this.busy = false;
      return;
    }

    this.state.comboCount = 0;

    for (let i = 0; i < move.steps.length; i++) {
      const step = move.steps[i];
      const { updatedPiece, promoted } = this.commitStep(piece, step);
      piece = updatedPiece;

      if (step.capturedPosition) {
        this.state.stats.captureCount += 1;
        this.state.comboCount += 1;
      }
      if (promoted) this.state.stats.kingsCreated += 1;

      const isLast = i === move.steps.length - 1;
      this.state = { ...this.state, lastMove: { ...move, steps: move.steps.slice(0, i + 1) } };
      this.emit();

      if (!isLast) await sleep(stepDelayMs);
    }

    // Mecánica de solo-reyes: si tras esta jugada ambos bandos quedaron
    // únicamente con reyes, cada casilla que la ficha desocupó a lo
    // largo del camino se marca con una X y queda inhabilitada para siempre.
    if (isAllKingsEndgame(this.board)) {
      for (const step of move.steps) {
        setPieceAt(this.board, step.from, createBlockedMarker(step.from));
      }
      this.state = { ...this.state, endgameLockdown: true };
      this.emit();
    }

    this.finishTurn();
    this.busy = false;
  }

  /** El jugador humano elige un destino final directamente (puede ser una parada intermedia de un combo de rey). */
  async playMove(pieceId: string, to: Position): Promise<boolean> {
    if (this.busy) return false;
    if (this.state.status !== "player-turn" || this.state.turn !== GAME_CONFIG.humanColor) return false;

    const options = this.getMoveOptions(pieceId);
    const match = options.find((o) => samePos(o.to, to));
    if (!match) return false;

    await this.executeMove(match.move, 260);
    return true;
  }

  /** Ejecuta una jugada completa calculada por la IA. */
  async applyAiMove(move: Move): Promise<void> {
    if (this.busy) return;
    if (this.state.turn !== GAME_CONFIG.aiColor) return;
    await this.executeMove(move, 320);
  }

  private finishTurn() {
    this.state.stats.moveCount += 1;
    this.state.stats.maxCombo = Math.max(this.state.stats.maxCombo, this.state.comboCount);
    this.state.comboCount = 0;

    const pieceEnd = checkPieceCountEnd(this.board);
    if (pieceEnd) {
      this.applyEndResult(pieceEnd);
      this.emit();
      return;
    }

    const nextTurn: PlayerColor = OPPONENT[this.state.turn];
    const noMovesEnd = checkNoMovesEnd(this.board, nextTurn);
    if (noMovesEnd) {
      this.applyEndResult(noMovesEnd);
      this.emit();
      return;
    }

    this.state.turn = nextTurn;
    this.state.status = nextTurn === GAME_CONFIG.humanColor ? "player-turn" : "ai-turn";
    this.emit();
  }

  private applyEndResult(result: NonNullable<EndResult>) {
    this.state.endedAt = Date.now();
    if (result.kind === "draw") {
      this.state.status = "draw";
      this.state.winner = null;
    } else {
      this.state.winner = result.winner;
      this.state.status = result.winner === GAME_CONFIG.humanColor ? "player-won" : "ai-won";
    }
  }
}
