"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { countryCodeToFlag } from "@/lib/utils/flags";
import { call } from "@/lib/net/socket";
import type { LeaderboardCategory, LeaderboardEntry, LeaderboardResponse } from "@/lib/net/types";

const TABS: { id: LeaderboardCategory; label: string; valueLabel: string }[] = [
  { id: "wins", label: "Más victorias", valueLabel: "Victorias" },
  { id: "games", label: "Más partidas", valueLabel: "Partidas" },
  { id: "streak", label: "Mejor racha", valueLabel: "Racha" },
];

function formatUpdatedAt(ts: number): string {
  const diffMs = Date.now() - ts;
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "hace menos de una hora";
  if (hours === 1) return "hace 1 hora";
  if (hours < 24) return `hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "hace 1 día" : `hace ${days} días`;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<LeaderboardCategory>("wins");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    call<{ category: LeaderboardCategory }, LeaderboardResponse>("leaderboard:get", { category: tab }).then((res) => {
      if (cancelled) return;
      setEntries(res.entries);
      setUpdatedAt(res.updatedAt);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-parchment">Ranking global</h1>
        <button onClick={() => router.push("/")} className="text-sm text-parchment/50 hover:text-parchment">
          Cerrar
        </button>
      </div>

      <div className="flex rounded-xl bg-void-raised p-1 text-sm font-medium">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 transition-colors ${
              tab === t.id ? "bg-ember text-white" : "text-parchment/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {updatedAt !== null && (
        <p className="text-center text-xs text-parchment/40">
          Top {entries.length} · actualizado {formatUpdatedAt(updatedAt)} (se refresca cada 24 h)
        </p>
      )}

      <div className="flex flex-col gap-1 rounded-2xl border border-void-line bg-void-panel p-2">
        {loading && <p className="p-4 text-center text-sm text-parchment/40">Cargando...</p>}
        {!loading && entries.length === 0 && (
          <p className="p-6 text-center text-sm text-parchment/40">Todavía nadie tiene partidas jugadas.</p>
        )}
        {!loading &&
          entries.map((entry) => (
            <button
              key={entry.rank}
              onClick={() => router.push(`/profile/${encodeURIComponent(entry.name)}`)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/5"
            >
              <span className="w-7 text-center text-sm font-semibold text-parchment/40">{entry.rank}</span>
              <span className="text-lg">{countryCodeToFlag(entry.country)}</span>
              <span className="flex-1 truncate text-sm font-medium text-parchment">{entry.name}</span>
              <span className="text-xs text-parchment/40">{entry.winRate}%</span>
              <span className="w-16 text-right text-sm font-semibold text-gold-bright">
                {tab === "games" ? entry.gamesPlayed : tab === "wins" ? entry.wins : entry.bestStreak}
              </span>
            </button>
          ))}
      </div>
      <p className="text-center text-[11px] text-parchment/30">{activeTab.valueLabel} por jugador, ordenado de mayor a menor.</p>

      <Button variant="secondary" onClick={() => router.push("/")}>
        Volver al menú
      </Button>
    </div>
  );
}
