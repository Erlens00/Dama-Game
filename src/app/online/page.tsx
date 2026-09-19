"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { call, getSocket } from "@/lib/net/socket";
import type { PublicRoomSummary, RoomView } from "@/lib/net/types";

export default function OnlinePage() {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState("");
  const [joinId, setJoinId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rooms, setRooms] = useState<PublicRoomSummary[]>([]);

  useEffect(() => {
    const socket = getSocket();
    call<undefined, PublicRoomSummary[]>("lobby:list").then(setRooms);
    function onRooms(list: PublicRoomSummary[]) {
      setRooms(list);
    }
    socket.on("lobby:rooms", onRooms);
    return () => {
      socket.off("lobby:rooms", onRooms);
    };
  }, []);

  async function handleCreate() {
    setError(null);
    if (!isPublic && !/^\d{6}$/.test(password)) {
      setError("La contraseña de una sala privada debe tener exactamente 6 dígitos.");
      return;
    }
    setBusy(true);
    const res = await call<{ isPublic: boolean; password?: string }, { ok: boolean; room?: RoomView; error?: string }>(
      "room:create",
      { isPublic, password }
    );
    setBusy(false);
    if (!res.ok || !res.room) {
      setError(res.error ?? "No se pudo crear la sala.");
      return;
    }
    router.push(`/online/room/${res.room.id}`);
  }

  async function handleJoinById() {
    setError(null);
    if (!joinId.trim()) return;
    setBusy(true);
    const res = await call<{ id: string; password?: string }, { ok: boolean; room?: RoomView; error?: string }>(
      "room:join",
      { id: joinId.trim().toUpperCase(), password: joinPassword }
    );
    setBusy(false);
    if (!res.ok || !res.room) {
      setError(res.error ?? "No se pudo unir a la sala.");
      return;
    }
    router.push(`/online/room/${res.room.id}`);
  }

  async function handleJoinPublic(id: string) {
    setError(null);
    setBusy(true);
    const res = await call<{ id: string }, { ok: boolean; room?: RoomView; error?: string }>("room:join", { id });
    setBusy(false);
    if (!res.ok || !res.room) {
      setError(res.error ?? "No se pudo unir a la sala.");
      return;
    }
    router.push(`/online/room/${res.room.id}`);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-parchment">Jugar Online</h1>
        <button onClick={() => router.push("/")} className="text-sm text-parchment/50 hover:text-parchment">
          Cerrar
        </button>
      </div>

      {error && <p className="rounded-lg bg-ember-dim/20 px-3 py-2 text-sm text-ember-bright">{error}</p>}

      <div className="flex flex-col gap-3 rounded-2xl border border-void-line bg-void-panel p-5">
        <p className="text-sm font-semibold text-parchment">Crear una sala</p>
        <div className="flex rounded-xl bg-void-raised p-1 text-sm font-medium">
          <button
            onClick={() => setIsPublic(true)}
            className={`flex-1 rounded-lg py-2 transition-colors ${isPublic ? "bg-ember text-white" : "text-parchment/60"}`}
          >
            Pública
          </button>
          <button
            onClick={() => setIsPublic(false)}
            className={`flex-1 rounded-lg py-2 transition-colors ${!isPublic ? "bg-ember text-white" : "text-parchment/60"}`}
          >
            Privada
          </button>
        </div>
        {!isPublic && (
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Contraseña de 6 dígitos"
            inputMode="numeric"
            className="rounded-lg border border-void-line bg-void px-3 py-2 text-center tracking-[0.3em] text-parchment outline-none focus:border-gold/60"
          />
        )}
        <Button onClick={handleCreate} disabled={busy} className="w-full">
          Crear sala
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-void-line bg-void-panel p-5">
        <p className="text-sm font-semibold text-parchment">Unirse con un ID</p>
        <div className="flex gap-2">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ID de sala"
            className="w-28 rounded-lg border border-void-line bg-void px-3 py-2 text-center uppercase tracking-widest text-parchment outline-none focus:border-gold/60"
          />
          <input
            value={joinPassword}
            onChange={(e) => setJoinPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Contraseña (si es privada)"
            inputMode="numeric"
            className="flex-1 rounded-lg border border-void-line bg-void px-3 py-2 text-center text-parchment outline-none focus:border-gold/60"
          />
        </div>
        <Button onClick={handleJoinById} disabled={busy} variant="secondary" className="w-full">
          Unirse
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-parchment">Salas públicas</p>
        <div className="flex flex-col gap-1 rounded-2xl border border-void-line bg-void-panel p-2">
          {rooms.length === 0 && <p className="p-4 text-center text-sm text-parchment/40">No hay salas públicas ahora mismo.</p>}
          {rooms.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
              <span className="rounded-md border border-void-line bg-void px-2 py-1 text-xs font-mono tracking-widest text-parchment/70">
                {r.id}
              </span>
              <span className="flex-1 truncate text-sm text-parchment">{r.hostName}</span>
              <span className="text-xs text-parchment/40">
                {r.players}/{r.maxPlayers}
              </span>
              {r.full || r.status !== "waiting" ? (
                <span className="text-xs text-ember-bright">{r.full ? "Llena" : "En partida"}</span>
              ) : (
                <Button size="md" onClick={() => handleJoinPublic(r.id)} disabled={busy}>
                  Unirse
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
