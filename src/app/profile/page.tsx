"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { countryCodeToFlag } from "@/lib/utils/flags";
import { call } from "@/lib/net/socket";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setCountry } = useAuth();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingCountry, setEditingCountry] = useState(false);
  const [countryInput, setCountryInput] = useState(profile?.country ?? "");

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const name = search.trim();
    if (!name) return;
    const res = await call<{ name: string }, { ok: boolean }>("profile:get", { name });
    if (!res.ok) {
      setError("No se encontró ningún jugador con ese nombre.");
      return;
    }
    router.push(`/profile/${encodeURIComponent(name)}`);
  }

  if (!profile) return null;
  const winRate = profile.stats.gamesPlayed > 0 ? Math.round((profile.stats.wins / profile.stats.gamesPlayed) * 100) : 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-parchment">Tu perfil</h1>
        <button onClick={() => router.push("/")} className="text-sm text-parchment/50 hover:text-parchment">
          Cerrar
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-void-line bg-void-panel p-5">
        <span className="text-4xl">{countryCodeToFlag(profile.country)}</span>
        <div className="flex-1">
          <p className="font-display text-xl text-parchment">{profile.name}</p>
          {!editingCountry ? (
            <button
              onClick={() => setEditingCountry(true)}
              className="text-xs text-parchment/40 hover:text-gold-bright"
            >
              Cambiar país
            </button>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await setCountry(countryInput);
                setEditingCountry(false);
              }}
              className="mt-1 flex items-center gap-2"
            >
              <input
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value.slice(0, 2).toUpperCase())}
                maxLength={2}
                className="w-14 rounded border border-void-line bg-void px-2 py-1 text-center text-xs uppercase text-parchment"
              />
              <button type="submit" className="text-xs text-gold-bright">
                Guardar
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Partidas jugadas" value={profile.stats.gamesPlayed} />
        <Stat label="% de victorias" value={`${winRate}%`} />
        <Stat label="Victorias" value={profile.stats.wins} accent="gold" />
        <Stat label="Derrotas" value={profile.stats.losses} accent="ember" />
        <Stat label="Racha actual" value={profile.stats.currentStreak} />
        <Stat label="Mejor racha" value={profile.stats.bestStreak} accent="gold" />
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 rounded-2xl border border-void-line bg-void-panel p-4">
        <p className="text-sm font-medium text-parchment">Buscar el perfil de otro jugador</p>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre exacto"
            className="flex-1 rounded-lg border border-void-line bg-void px-3 py-2 text-sm text-parchment outline-none focus:border-gold/60"
          />
          <Button type="submit" size="md">
            Ver
          </Button>
        </div>
        {error && <p className="text-xs text-ember-bright">{error}</p>}
      </form>

      <Button variant="secondary" onClick={() => router.push("/")}>
        Volver al menú
      </Button>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: "gold" | "ember" }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-void-line bg-void-panel p-4">
      <span
        className={`text-2xl font-semibold ${
          accent === "gold" ? "text-gold-bright" : accent === "ember" ? "text-ember-bright" : "text-parchment"
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-parchment/40">{label}</span>
    </div>
  );
}
