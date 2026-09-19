"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GAME_CONFIG } from "@/lib/game/config";
import { useAuth } from "@/components/providers/AuthProvider";
import { countryCodeToFlag } from "@/lib/utils/flags";

export function HomeScreen() {
  const router = useRouter();
  const { profile, logout } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      {profile && (
        <div className="fixed right-3 top-3 flex items-center gap-2 rounded-full border border-void-line bg-void-panel px-3 py-1.5 text-xs text-parchment/70">
          <span className="text-base leading-none">{countryCodeToFlag(profile.country)}</span>
          <span className="font-medium text-parchment">{profile.name}</span>
          <button onClick={logout} className="text-parchment/40 hover:text-ember-bright" aria-label="Cerrar sesión">
            ⏻
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className="flex items-center gap-3">
          <CrownMark />
          <h1 className="font-display text-5xl font-bold tracking-tight text-parchment sm:text-6xl">
            {GAME_CONFIG.gameName}
          </h1>
        </div>
        <p className="max-w-sm text-balance text-sm text-parchment/50">
          Una variante propia de damas. Juega contra una IA que piensa de verdad, o retá a otras personas online, en
          un tablero que se siente como un juego de estrategia real.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <MiniBoardPreview />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex w-full max-w-xs flex-col items-center gap-3"
      >
        <Button size="lg" className="w-full" onClick={() => router.push("/play")}>
          Jugar contra la IA
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={() => router.push("/online")}>
          Jugar Online
        </Button>

        <div className="mt-1 flex w-full gap-2">
          <Button size="md" variant="ghost" className="flex-1" onClick={() => router.push("/profile")}>
            Perfil
          </Button>
          <Button size="md" variant="ghost" className="flex-1" onClick={() => router.push("/leaderboard")}>
            Ranking
          </Button>
        </div>
        <div className="flex w-full gap-2">
          <Button size="md" variant="ghost" className="flex-1" onClick={() => router.push("/stats")}>
            Estadísticas locales
          </Button>
          <Button size="md" variant="ghost" className="flex-1" onClick={() => router.push("/settings")}>
            Configuración
          </Button>
        </div>
        <Button size="md" variant="ghost" className="w-full" locked disabled>
          Historial
        </Button>
      </motion.div>
    </div>
  );
}

function CrownMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 text-gold-bright" fill="currentColor">
      <path d="M3 18h18v2H3v-2Zm.6-9.6L7 11l5-7 5 7 3.4-2.6L19 17H5L3.6 8.4Z" />
    </svg>
  );
}

function MiniBoardPreview() {
  const cells = Array.from({ length: 64 }, (_, i) => i);
  return (
    <div className="grid h-40 w-40 grid-cols-8 overflow-hidden rounded-xl border-2 border-walnut-light shadow-panel sm:h-48 sm:w-48">
      {cells.map((i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const dark = (row + col) % 2 === 1;
        const hasPiece = dark && (row < 2 || row > 5);
        const isBlack = row < 2;
        return (
          <div key={i} className={`relative ${dark ? "bg-walnut" : "bg-parchment/90"}`}>
            {hasPiece && (
              <span
                className={`absolute inset-[16%] rounded-full ${
                  isBlack ? "bg-gradient-to-b from-obsidian-bright to-obsidian" : "bg-gradient-to-b from-ember-bright to-ember-dim"
                } shadow-piece`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
