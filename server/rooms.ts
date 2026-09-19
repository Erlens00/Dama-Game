import crypto from "crypto";
import { createInitialBoard, createBlockedMarker, findPieceById, isAllKingsEndgame, setPieceAt } from "../src/lib/game/board";
import { getLegalMovesForPiece, getLegalMoveSet } from "../src/lib/game/moveValidator";
import { checkNoMovesEnd, checkPieceCountEnd } from "../src/lib/game/winConditions";
import { applyMoveToBoard } from "../src/lib/ai/minimax";
import type { Board, GameStats, Move, PlayerColor, Position } from "../src/lib/game/types";

export interface RoomPlayer {
  socketId: string;
  userKey: string;
  name: string;
  country: string;
  streak: number;
  bestStreak: number;
  color: PlayerColor | null;
  ready: boolean;
}

export interface ChatMessage {
  name: string;
  text: string;
  ts: number;
}

export type RoomStatus = "waiting" | "playing" | "finished";

export interface Room {
  id: string;
  isPublic: boolean;
  passwordHash: string | null;
  hostSocketId: string;
  players: RoomPlayer[];
  chat: ChatMessage[];
  status: RoomStatus;
  board: Board;
  turn: PlayerColor;
  stats: GameStats;
  winner: PlayerColor | null;
  lastMove: Move | null;
  endgameLockdown: boolean;
  createdAt: number;
}

const MAX_PLAYERS = 2;
const rooms = new Map<string, Room>();

function generateRoomId(): string {
  // 6 caracteres alfanuméricos en mayúsculas, fáciles de compartir de palabra.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos (0/O, 1/I)
  let id = "";
  do {
    id = Array.from({ length: 6 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  } while (rooms.has(id));
  return id;
}

export function hashRoomPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function createRoom(opts: { isPublic: boolean; password?: string; host: RoomPlayer }): Room {
  const id = generateRoomId();
  const room: Room = {
    id,
    isPublic: opts.isPublic,
    passwordHash: opts.isPublic ? null : hashRoomPassword(opts.password ?? ""),
    hostSocketId: opts.host.socketId,
    players: [opts.host],
    chat: [],
    status: "waiting",
    board: createInitialBoard(),
    turn: "black",
    stats: { moveCount: 0, captureCount: 0, kingsCreated: 0, maxCombo: 0 },
    winner: null,
    lastMove: null,
    endgameLockdown: false,
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | null {
  return rooms.get(id.toUpperCase()) ?? null;
}

export function listPublicRooms(): Room[] {
  return Array.from(rooms.values())
    .filter((r) => r.isPublic)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
}

export function findRoomBySocket(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socketId === socketId)) return room;
  }
  return null;
}

export type JoinResult =
  | { ok: true; room: Room }
  | { ok: false; error: "not-found" | "full" | "wrong-password" | "already-in-room" };

export function joinRoom(id: string, password: string | undefined, player: RoomPlayer): JoinResult {
  const room = getRoom(id);
  if (!room) return { ok: false, error: "not-found" };
  if (room.players.length >= MAX_PLAYERS) return { ok: false, error: "full" };
  if (room.players.some((p) => p.socketId === player.socketId)) return { ok: false, error: "already-in-room" };
  if (!room.isPublic) {
    const attempt = hashRoomPassword(password ?? "");
    if (attempt !== room.passwordHash) return { ok: false, error: "wrong-password" };
  }
  room.players.push(player);
  return { ok: true, room };
}

export function removePlayer(socketId: string): Room | null {
  const room = findRoomBySocket(socketId);
  if (!room) return null;
  room.players = room.players.filter((p) => p.socketId !== socketId);
  if (room.players.length === 0) {
    deleteRoom(room.id);
    return null;
  }
  // Si el anfitrión se fue, el jugador restante pasa a ser el nuevo anfitrión.
  if (room.hostSocketId === socketId) room.hostSocketId = room.players[0].socketId;
  room.status = "waiting";
  return room;
}

/** El anfitrión inicia la partida: asigna negro/rojo al azar a cada jugador (negro siempre empieza). */
export function startRoomGame(room: Room): void {
  const shuffled = [...room.players].sort(() => Math.random() - 0.5);
  const colors: PlayerColor[] = ["black", "red"];
  shuffled.forEach((p, i) => {
    p.color = colors[i];
  });

  room.board = createInitialBoard();
  room.turn = "black";
  room.status = "playing";
  room.stats = { moveCount: 0, captureCount: 0, kingsCreated: 0, maxCombo: 0 };
  room.winner = null;
  room.lastMove = null;
  room.endgameLockdown = false;
}

export interface MoveOptionPreview {
  to: Position;
  isCapture: boolean;
  captureCount: number;
}

/** Vista previa (sin ejecutar) de los destinos válidos de una ficha, para resaltarlos en el cliente. */
export function previewMoves(room: Room, socketId: string, pieceId: string): MoveOptionPreview[] {
  if (room.status !== "playing") return [];
  const player = room.players.find((p) => p.socketId === socketId);
  if (!player || player.color !== room.turn) return [];

  const piece = findPieceById(room.board, pieceId);
  if (!piece || piece.color !== player.color) return [];

  return getLegalMovesForPiece(room.board, piece).map((m) => {
    const last = m.steps[m.steps.length - 1];
    return { to: last.to, isCapture: m.isCapture, captureCount: m.steps.filter((s) => s.capturedId).length };
  });
}

export function selectablePieceIds(room: Room, socketId: string): string[] {
  if (room.status !== "playing") return [];
  const player = room.players.find((p) => p.socketId === socketId);
  if (!player || player.color !== room.turn) return [];
  return Array.from(getLegalMoveSet(room.board, player.color).byPiece.keys());
}

export interface MoveAttemptResult {
  ok: boolean;
  error?: string;
}

/** Ejecuta una jugada completa (el cliente ya eligió el destino final; el servidor valida y aplica). */
export function attemptMove(room: Room, socketId: string, pieceId: string, to: Position): MoveAttemptResult {
  if (room.status !== "playing") return { ok: false, error: "La partida no está en curso." };
  const player = room.players.find((p) => p.socketId === socketId);
  if (!player || player.color !== room.turn) return { ok: false, error: "No es tu turno." };

  const piece = findPieceById(room.board, pieceId);
  if (!piece || piece.color !== player.color) return { ok: false, error: "Ficha inválida." };

  const options = getLegalMovesForPiece(room.board, piece);
  const move = options.find((m) => {
    const last = m.steps[m.steps.length - 1];
    return last.to.row === to.row && last.to.col === to.col;
  });
  if (!move) return { ok: false, error: "Movimiento no permitido." };

  room.board = applyMoveToBoard(room.board, move);
  room.lastMove = move;
  room.stats.moveCount += 1;
  const captures = move.steps.filter((s) => s.capturedId).length;
  room.stats.captureCount += captures;
  room.stats.maxCombo = Math.max(room.stats.maxCombo, captures);
  if (move.promotesAt) room.stats.kingsCreated += 1;

  if (isAllKingsEndgame(room.board)) {
    for (const step of move.steps) {
      setPieceAt(room.board, step.from, createBlockedMarker(step.from));
    }
    room.endgameLockdown = true;
  }

  const pieceEnd = checkPieceCountEnd(room.board);
  if (pieceEnd) {
    room.status = "finished";
    room.winner = pieceEnd.kind === "winner" ? pieceEnd.winner : null;
    return { ok: true };
  }

  const nextTurn: PlayerColor = room.turn === "black" ? "red" : "black";
  const noMoves = checkNoMovesEnd(room.board, nextTurn);
  if (noMoves) {
    room.status = "finished";
    room.winner = noMoves.kind === "winner" ? noMoves.winner : null;
    return { ok: true };
  }

  room.turn = nextTurn;
  return { ok: true };
}

export function addChatMessage(room: Room, name: string, text: string): ChatMessage {
  const message: ChatMessage = { name, text: text.slice(0, 300), ts: Date.now() };
  room.chat.push(message);
  if (room.chat.length > 200) room.chat.shift();
  return message;
}

/** Vista pública de la sala (sin el hash de contraseña) que se envía a los clientes. */
export function serializeRoom(room: Room) {
  return {
    id: room.id,
    isPublic: room.isPublic,
    hasPassword: !room.isPublic,
    hostSocketId: room.hostSocketId,
    players: room.players.map((p) => ({
      socketId: p.socketId,
      name: p.name,
      country: p.country,
      streak: p.streak,
      bestStreak: p.bestStreak,
      color: p.color,
      ready: p.ready,
    })),
    chat: room.chat,
    status: room.status,
    board: room.board,
    turn: room.turn,
    stats: room.stats,
    winner: room.winner,
    lastMove: room.lastMove,
    endgameLockdown: room.endgameLockdown,
    full: room.players.length >= MAX_PLAYERS,
  };
}

export function serializePublicRoomSummary(room: Room) {
  return {
    id: room.id,
    players: room.players.length,
    maxPlayers: MAX_PLAYERS,
    full: room.players.length >= MAX_PLAYERS,
    status: room.status,
    hostName: room.players.find((p) => p.socketId === room.hostSocketId)?.name ?? "?",
  };
}
