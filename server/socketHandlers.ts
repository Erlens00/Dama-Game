import type { Server, Socket } from "socket.io";
import { login, register, resolveSession, isValidCountryCode } from "./auth";
import { findUser, publicProfile, updateUser } from "./db";
import { getLeaderboard, type LeaderboardCategory } from "./leaderboard";
import {
  addChatMessage,
  attemptMove,
  createRoom,
  findRoomBySocket,
  joinRoom,
  listPublicRooms,
  previewMoves,
  removePlayer,
  selectablePieceIds,
  serializePublicRoomSummary,
  serializeRoom,
  startRoomGame,
  type Room,
  type RoomPlayer,
} from "./rooms";
import type { PlayerColor, Position } from "../src/lib/game/types";
import type { UserRecord } from "./db";

function broadcastRoom(io: Server, room: Room) {
  io.to(room.id).emit("room:state", serializeRoom(room));
}

function broadcastPublicRoomList(io: Server) {
  io.emit(
    "lobby:rooms",
    listPublicRooms().map(serializePublicRoomSummary)
  );
}

/** Cuando una partida de sala termina, actualiza las estadísticas persistentes de ambos jugadores. */
function recordRoomResult(room: Room) {
  for (const p of room.players) {
    if (!p.color) continue;
    const won = room.winner !== null && room.winner === p.color;
    const lost = room.winner !== null && room.winner !== p.color;
    updateUser(p.userKey, (user) => {
      const stats = { ...user.stats };
      stats.gamesPlayed += 1;
      if (won) {
        stats.wins += 1;
        stats.currentStreak += 1;
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      } else if (lost) {
        stats.losses += 1;
        stats.currentStreak = 0;
      } else {
        stats.draws += 1;
        stats.currentStreak = 0;
      }
      return { ...user, stats };
    });

    const refreshed = findUser(p.userKey);
    if (refreshed) {
      p.streak = refreshed.stats.currentStreak;
      p.bestStreak = refreshed.stats.bestStreak;
    }
  }
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const tokenFromHandshake = socket.handshake.auth?.token as string | undefined;
    let currentUser: UserRecord | null = resolveSession(tokenFromHandshake);
    socket.data.user = currentUser;

    // ---------- Autenticación ----------
    socket.on("auth:register", (payload: { name: string; password: string; country: string }, cb) => {
      const result = register(payload.name, payload.password, payload.country);
      if (result.ok && result.user && result.token) {
        currentUser = result.user;
        socket.data.user = currentUser;
        cb({ ok: true, token: result.token, profile: publicProfile(result.user) });
      } else {
        cb({ ok: false, error: result.error });
      }
    });

    socket.on("auth:login", (payload: { name: string; password: string }, cb) => {
      const result = login(payload.name, payload.password);
      if (result.ok && result.user && result.token) {
        currentUser = result.user;
        socket.data.user = currentUser;
        cb({ ok: true, token: result.token, profile: publicProfile(result.user) });
      } else {
        cb({ ok: false, error: result.error });
      }
    });

    socket.on("auth:me", (_payload, cb) => {
      cb(currentUser ? { ok: true, profile: publicProfile(currentUser) } : { ok: false });
    });

    socket.on("profile:setCountry", (payload: { country: string }, cb) => {
      if (!currentUser) return cb({ ok: false, error: "No autenticado." });
      if (!isValidCountryCode(payload.country)) return cb({ ok: false, error: "Código de país inválido." });
      const updated = updateUser(currentUser.key, (u) => ({ ...u, country: payload.country.toUpperCase() }));
      if (updated) {
        currentUser = updated;
        socket.data.user = updated;
      }
      cb({ ok: true, profile: updated ? publicProfile(updated) : null });
    });

    socket.on("profile:get", (payload: { name: string }, cb) => {
      const user = findUser(payload.name);
      cb(user ? { ok: true, profile: publicProfile(user) } : { ok: false, error: "Usuario no encontrado." });
    });

    // ---------- Ranking global ----------
    socket.on("leaderboard:get", (payload: { category: LeaderboardCategory }, cb) => {
      cb(getLeaderboard(payload.category));
    });

    // ---------- Lobby / salas ----------
    socket.on("lobby:list", (_payload, cb) => {
      cb(listPublicRooms().map(serializePublicRoomSummary));
    });

    socket.on("room:create", (payload: { isPublic: boolean; password?: string }, cb) => {
      if (!currentUser) return cb({ ok: false, error: "No autenticado." });
      if (findRoomBySocket(socket.id)) return cb({ ok: false, error: "Ya estás en una sala." });
      if (!payload.isPublic) {
        if (!/^\d{6}$/.test(payload.password ?? "")) {
          return cb({ ok: false, error: "La contraseña debe tener exactamente 6 dígitos." });
        }
      }

      const host: RoomPlayer = {
        socketId: socket.id,
        userKey: currentUser.key,
        name: currentUser.displayName,
        country: currentUser.country,
        streak: currentUser.stats.currentStreak,
        bestStreak: currentUser.stats.bestStreak,
        color: null,
        ready: false,
      };
      const room = createRoom({ isPublic: payload.isPublic, password: payload.password, host });
      socket.join(room.id);
      cb({ ok: true, room: serializeRoom(room) });
      broadcastRoom(io, room);
      if (room.isPublic) broadcastPublicRoomList(io);
    });

    socket.on("room:get", (_payload, cb) => {
      const room = findRoomBySocket(socket.id);
      cb(room ? { ok: true, room: serializeRoom(room) } : { ok: false });
    });

    socket.on("room:join", (payload: { id: string; password?: string }, cb) => {
      if (!currentUser) return cb({ ok: false, error: "No autenticado." });
      if (findRoomBySocket(socket.id)) return cb({ ok: false, error: "Ya estás en una sala." });

      const player: RoomPlayer = {
        socketId: socket.id,
        userKey: currentUser.key,
        name: currentUser.displayName,
        country: currentUser.country,
        streak: currentUser.stats.currentStreak,
        bestStreak: currentUser.stats.bestStreak,
        color: null,
        ready: false,
      };
      const result = joinRoom(payload.id, payload.password, player);
      if (!result.ok) {
        const messages: Record<string, string> = {
          "not-found": "No existe una sala con ese ID.",
          full: "Esa sala ya está llena.",
          "wrong-password": "Contraseña incorrecta.",
          "already-in-room": "Ya estás en esta sala.",
        };
        return cb({ ok: false, error: messages[result.error] });
      }

      socket.join(result.room.id);
      cb({ ok: true, room: serializeRoom(result.room) });
      broadcastRoom(io, result.room);
      if (result.room.isPublic) broadcastPublicRoomList(io);
    });

    socket.on("room:leave", (_payload, cb) => {
      const room = removePlayer(socket.id);
      socket.rooms.forEach((r) => {
        if (r !== socket.id) socket.leave(r);
      });
      if (room) {
        broadcastRoom(io, room);
        if (room.isPublic) broadcastPublicRoomList(io);
      } else {
        broadcastPublicRoomList(io);
      }
      cb?.({ ok: true });
    });

    socket.on("room:start", (_payload, cb) => {
      const room = findRoomBySocket(socket.id);
      if (!room) return cb({ ok: false, error: "No estás en ninguna sala." });
      if (room.hostSocketId !== socket.id) return cb({ ok: false, error: "Solo el anfitrión puede iniciar la partida." });
      if (room.players.length < 2) return cb({ ok: false, error: "Esperando al segundo jugador." });

      startRoomGame(room);
      cb({ ok: true });
      broadcastRoom(io, room);
    });

    socket.on("room:rematch", (_payload, cb) => {
      const room = findRoomBySocket(socket.id);
      if (!room) return cb({ ok: false, error: "No estás en ninguna sala." });
      if (room.hostSocketId !== socket.id) return cb({ ok: false, error: "Solo el anfitrión puede reiniciar la partida." });
      startRoomGame(room);
      cb({ ok: true });
      broadcastRoom(io, room);
    });

    socket.on("room:chat", (payload: { text: string }, cb) => {
      const room = findRoomBySocket(socket.id);
      if (!room || !currentUser) return cb?.({ ok: false });
      const text = (payload.text ?? "").trim();
      if (!text) return cb?.({ ok: false });
      addChatMessage(room, currentUser.displayName, text);
      io.to(room.id).emit("room:state", serializeRoom(room));
      cb?.({ ok: true });
    });

    socket.on("room:selectable", (_payload, cb) => {
      const room = findRoomBySocket(socket.id);
      if (!room) return cb([]);
      cb(selectablePieceIds(room, socket.id));
    });

    socket.on("room:previewMoves", (payload: { pieceId: string }, cb) => {
      const room = findRoomBySocket(socket.id);
      if (!room) return cb([]);
      cb(previewMoves(room, socket.id, payload.pieceId));
    });

    socket.on("room:move", (payload: { pieceId: string; to: Position }, cb) => {
      const room = findRoomBySocket(socket.id);
      if (!room) return cb({ ok: false, error: "No estás en ninguna sala." });
      const result = attemptMove(room, socket.id, payload.pieceId, payload.to);
      if (!result.ok) return cb(result);

      if (room.status === "finished") recordRoomResult(room);
      cb({ ok: true });
      broadcastRoom(io, room);
    });

    socket.on("disconnect", () => {
      const room = removePlayer(socket.id);
      if (room) {
        broadcastRoom(io, room);
        if (room.isPublic) broadcastPublicRoomList(io);
      }
    });
  });
}

export type { PlayerColor };
