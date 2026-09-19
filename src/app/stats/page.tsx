"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DEFAULT_STATS, loadStats, resetStats, type PersistedStats } from "@/lib/storage/stats";

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Fácil", medium: "Media", hard: "Difícil", extreme: "Extremo" };

function formatTime(ms: number | null) {
  if (ms === null) return "—";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PersistedStats>(DEFAULT_STATS);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-parchment">Estadísticas</h1>
        <button onClick={() => router.back()} className="text-sm text-parchment/50 hover:text-parchment">
          Cerrar
        </button>
      </div>

      {stats.gamesPlayed === 0 ? (
        <div className="rounded-2xl border border-void-line bg-void-panel p-8 text-center text-sm text-parchment/50">
          Todavía no has jugado ninguna partida. Tus estadísticas aparecerán aquí.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card label="Partidas jugadas" value={stats.gamesPlayed} />
            <Card label="% de victorias" value={`${winRate}%`} />
            <Card label="Victorias" value={stats.wins} accent="gold" />
            <Card label="Derrotas" value={stats.losses} accent="ember" />
            <Card label="Empates" value={stats.draws} />
            <Card label="Mejor racha" value={stats.bestStreak} />
            <Card label="Capturas totales" value={stats.totalCaptures} />
            <Card label="Reyes creados" value={stats.totalKings} />
            <Card label="Mejor tiempo" value={formatTime(stats.bestTimeMs)} />
            <Card
              label="Dificultad más alta superada"
              value={stats.hardestDifficultyBeaten ? DIFFICULTY_LABEL[stats.hardestDifficultyBeaten] : "—"}
            />
          </div>

          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm("¿Reiniciar todas las estadísticas guardadas?")) {
                setStats(resetStats());
              }
            }}
          >
            Reiniciar estadísticas
          </Button>
        </>
      )}

      <Button variant="secondary" onClick={() => router.push("/")}>
        Volver al menú
      </Button>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string | number; accent?: "gold" | "ember" }) {
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
