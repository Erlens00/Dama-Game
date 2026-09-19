"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { call, getSocket } from "@/lib/net/socket";
import { getMoveSnapshots } from "@/lib/game/replay";
import { soundManager } from "@/lib/audio/soundManager";
import type { Board, Position } from "@/lib/game/types";
import type { MoveOptionPreviewLike, RoomView } from "@/lib/net/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useOnlineRoom(roomId: string) {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [displayBoard, setDisplayBoard] = useState<Board | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [moveOptions, setMoveOptions] = useState<MoveOptionPreviewLike[]>([]);
  const [selectableIds, setSelectableIds] = useState<string[]>([]);
  const [animating, setAnimating] = useState(false);

  const prevBoardRef = useRef<Board | null>(null);
  const prevMoveCountRef = useRef<number>(-1);
  const animationToken = useRef(0);

  const mySocketId = getSocket().id ?? "";
  const me = room?.players.find((p) => p.socketId === mySocketId) ?? null;
  const opponent = room?.players.find((p) => p.socketId !== mySocketId) ?? null;
  const isHost = room?.hostSocketId === mySocketId;
  const myTurn = !!(room && me && room.turn === me.color && room.status === "playing");

  const playAnimation = useCallback(async (from: Board, view: RoomView) => {
    const token = ++animationToken.current;
    if (!view.lastMove) {
      setDisplayBoard(view.board);
      return;
    }
    setAnimating(true);
    const snapshots = getMoveSnapshots(from, view.lastMove);
    for (let i = 0; i < snapshots.length; i++) {
      if (animationToken.current !== token) return;
      setDisplayBoard(snapshots[i]);
      if (i < snapshots.length - 1) await sleep(240);
    }
    if (animationToken.current !== token) return;
    setDisplayBoard(view.board);
    setAnimating(false);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    function onState(view: RoomView) {
      const isNewMove = view.stats.moveCount !== prevMoveCountRef.current && prevBoardRef.current;
      setRoom(view);

      if (isNewMove && prevBoardRef.current) {
        playAnimation(prevBoardRef.current, view);
        const captured = (view.lastMove?.steps.filter((s) => s.capturedId).length ?? 0) > 0;
        soundManager.play(view.lastMove?.promotesAt ? "king" : captured ? "capture" : "move");
      } else {
        setDisplayBoard(view.board);
      }

      prevBoardRef.current = view.board;
      prevMoveCountRef.current = view.stats.moveCount;
      setSelectedPieceId(null);
      setMoveOptions([]);
    }

    socket.on("room:state", onState);

    // Pide el estado actual al entrar a la pantalla de sala (por si nadie
    // emitió un evento nuevo desde que se creó/unió, p. ej. una sala recién creada).
    call<undefined, { ok: boolean; room?: RoomView }>("room:get").then((res) => {
      if (res.ok && res.room) onState(res.room);
    });

    return () => {
      socket.off("room:state", onState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Actualiza qué fichas son seleccionables cuando cambia el turno/estado.
  useEffect(() => {
    if (!room || room.status !== "playing") {
      setSelectableIds([]);
      return;
    }
    let cancelled = false;
    call<undefined, string[]>("room:selectable").then((ids) => {
      if (!cancelled) setSelectableIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [room?.turn, room?.status, room?.stats.moveCount]);

  const selectPiece = useCallback(
    async (pieceId: string) => {
      if (!myTurn || animating) return;
      if (!selectableIds.includes(pieceId)) {
        soundManager.play("error");
        return;
      }
      setSelectedPieceId(pieceId);
      soundManager.play("select");
      const options = await call<{ pieceId: string }, MoveOptionPreviewLike[]>("room:previewMoves", { pieceId });
      setMoveOptions(options);
    },
    [myTurn, animating, selectableIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedPieceId(null);
    setMoveOptions([]);
  }, []);

  const moveTo = useCallback(
    async (to: Position) => {
      if (!selectedPieceId) return;
      const res = await call<{ pieceId: string; to: Position }, { ok: boolean; error?: string }>("room:move", {
        pieceId: selectedPieceId,
        to,
      });
      if (!res.ok) soundManager.play("error");
      setSelectedPieceId(null);
      setMoveOptions([]);
    },
    [selectedPieceId]
  );

  const sendChat = useCallback((text: string) => {
    call("room:chat", { text });
  }, []);

  const startGame = useCallback(() => call<undefined, { ok: boolean; error?: string }>("room:start"), []);
  const rematch = useCallback(() => call<undefined, { ok: boolean; error?: string }>("room:rematch"), []);
  const leaveRoom = useCallback(() => call("room:leave"), []);

  return {
    room,
    board: displayBoard,
    me,
    opponent,
    isHost,
    myTurn,
    animating,
    selectedPieceId,
    moveOptions,
    selectableIds,
    selectPiece,
    clearSelection,
    moveTo,
    sendChat,
    startGame,
    rematch,
    leaveRoom,
  };
}
