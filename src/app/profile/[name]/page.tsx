"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { countryCodeToFlag } from "@/lib/utils/flags";
import { call } from "@/lib/net/socket";
import type { PublicProfile } from "@/lib/net/types";

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    call<{ name: string }, { ok: boolean; profile?: PublicProfile; error?: string }>("profile:get", { name }).then(
      (res) => {
        if (cancelled) return;
        if (res.ok && res.profile) setProfile(res.profile);
        else setError(res.error ?? "Jugador no encontrado.");
      }
    );
    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-parchment">Perfil</h1>
        <button onClick={() => router.push("/leaderboard")} className="text-sm text-parchment/50 hover:text-parchment">
          Cerrar
        </button>
      </div>

      {error && <p className="text-sm text-ember-bright">{error}</p>}

      {profile && (
        <>
          <div className="flex items-center gap-3 rounded-2xl border border-void-line bg-void-panel p-5">
            <span className="text-4xl">{countryCodeToFlag(profile.country)}</span>
            <p className="font-display text-xl text-parchment">{profile.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="% de victorias"
              value={`${
                profile.stats.gamesPlayed > 0 ? Math.round((profile.stats.wins / profile.stats.gamesPlayed) * 100) : 0
              }%`}
            />
            <Stat label="Partidas jugadas" value={profile.stats.gamesPlayed} />
            <Stat label="Victorias" value={profile.stats.wins} accent="gold" />
            <Stat label="Derrotas" value={profile.stats.losses} accent="ember" />
            <Stat label="Racha actual" value={profile.stats.currentStreak} />
            <Stat label="Mejor racha" value={profile.stats.bestStreak} accent="gold" />
          </div>
        </>
      )}

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
