"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Board } from "@/components/board/Board";
import { RoomChat } from "@/components/online/RoomChat";
import { PlayerBadge } from "@/components/online/PlayerBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { useAuth } from "@/components/providers/AuthProvider";

const COLOR_LABEL: Record<string, string> = { black: "Negro", red: "Rojo" };

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const { profile } = useAuth();
  const online = useOnlineRoom(roomId);
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWaitedTooLong(true), 3000);
    return () => clearTimeout(t);
  }, []);

  async function handleLeave() {
    await online.leaveRoom();
    router.push("/online");
  }

  if (!online.room) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        {waitedTooLong ? (
          <>
            <p className="text-parchment/60">No se encontró esta sala en tu conexión actual.</p>
            <p className="max-w-xs text-xs text-parchment/40">
              Si recargaste la página, la conexión con la sala se pierde (es una limitación de esta versión). Vuelve
              al lobby y únete de nuevo con el ID.
            </p>
            <Button onClick={() => router.push("/online")}>Volver al lobby</Button>
          </>
        ) : (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        )}
      </div>
    );
  }

  const { room } = online;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between text-xs text-parchment/50">
        <button onClick={handleLeave} className="hover:text-parchment">
          ← Salir
        </button>
        <span className="rounded-full border border-void-line bg-void-raised px-3 py-1 font-mono tracking-widest">
          Sala {room.id}
        </span>
      </div>

      {room.status === "waiting" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-2xl border border-void-line bg-void-panel p-4">
            <PlayerBadge player={room.players[0] ?? null} />
            <span className="text-parchment/30">vs</span>
            <PlayerBadge player={room.players[1] ?? null} align="right" />
          </div>

          {online.isHost ? (
            <Button size="lg" disabled={room.players.length < 2} onClick={() => online.startGame()}>
              {room.players.length < 2 ? "Esperando al segundo jugador..." : "Iniciar partida"}
            </Button>
          ) : (
            <p className="text-center text-sm text-parchment/50">Esperando a que el anfitrión inicie la partida...</p>
          )}

          <RoomChat messages={room.chat} onSend={online.sendChat} myName={profile?.name} />
        </motion.div>
      )}

      {(room.status === "playing" || room.status === "finished") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-void-line bg-void-panel px-3 py-2">
            <PlayerBadge player={online.opponent} />
            <span className="text-xs font-medium text-parchment/50">
              {room.status === "playing" ? (online.myTurn ? "Tu turno" : "Turno rival") : "Partida terminada"}
            </span>
            <PlayerBadge player={online.me} align="right" />
          </div>

          {online.board && (
            <Board
              board={online.board}
              selectedPieceId={online.selectedPieceId}
              selectablePieceIds={online.selectableIds}
              moveOptions={online.moveOptions}
              onSelectPiece={online.selectPiece}
              onMoveTo={online.moveTo}
              onEmptyClick={online.clearSelection}
              disabled={!online.myTurn || online.animating}
              myColor={online.me?.color ?? "black"}
              flip={online.me?.color === "red"}
            />
          )}

          <RoomChat messages={room.chat} onSend={online.sendChat} myName={profile?.name} />
        </div>
      )}

      <Modal open={room.status === "finished"}>
        <div className="flex flex-col items-center gap-5 p-8 text-center">
          <p className="font-display text-3xl font-bold text-gold-bright">
            {room.winner === null
              ? "EMPATE"
              : room.winner === online.me?.color
                ? "¡VICTORIA!"
                : "DERROTA"}
          </p>
          <p className="text-sm text-parchment/50">
            {room.winner ? `Ganaron las fichas ${COLOR_LABEL[room.winner]}.` : "Nadie pudo capturar todas las fichas rivales."}
          </p>
          <div className="flex w-full flex-col gap-2">
            {online.isHost ? (
              <Button size="lg" className="w-full" onClick={() => online.rematch()}>
                Jugar de nuevo
              </Button>
            ) : (
              <p className="text-xs text-parchment/40">Esperando a que el anfitrión inicie la revancha...</p>
            )}
            <Button variant="secondary" className="w-full" onClick={handleLeave}>
              Salir al lobby
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
