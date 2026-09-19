"use client";

import { countryCodeToFlag } from "@/lib/utils/flags";
import type { RoomPlayerView } from "@/lib/net/types";

export function PlayerBadge({ player, align = "left" }: { player: RoomPlayerView | null; align?: "left" | "right" }) {
  if (!player) {
    return (
      <div className={`flex items-center gap-2 text-xs text-parchment/30 ${align === "right" ? "flex-row-reverse" : ""}`}>
        Esperando rival...
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <span className="text-xl">{countryCodeToFlag(player.country)}</span>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-parchment">{player.name}</span>
        <span className="text-[11px] text-parchment/40">🔥 racha {player.streak}</span>
      </div>
      {player.color && (
        <span
          className={`h-3 w-3 rounded-full ${player.color === "black" ? "bg-obsidian border border-parchment/30" : "bg-ember-bright"}`}
        />
      )}
    </div>
  );
}
