"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { soundManager } from "@/lib/audio/soundManager";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type AppSettings } from "@/lib/storage/settings";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    if (key === "soundOn") soundManager.setEnabled(value as boolean);
    if (key === "volume") soundManager.setVolume(value as number);
    if (key === "soundOn" && value) soundManager.play("click");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-parchment">Configuración</h1>
        <button onClick={() => router.back()} className="text-sm text-parchment/50 hover:text-parchment">
          Cerrar
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-void-line bg-void-panel p-5">
        <Toggle
          label="Sonido"
          description="Efectos de selección, movimiento, captura y victoria."
          checked={settings.soundOn}
          onChange={(v) => update("soundOn", v)}
        />
        <Toggle
          label="Música"
          description="Música ambiental durante la partida."
          checked={settings.musicOn}
          onChange={(v) => update("musicOn", v)}
        />

        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between text-sm font-medium text-parchment">
            Volumen
            <span className="text-parchment/40">{Math.round(settings.volume * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => update("volume", Number(e.target.value))}
            className="accent-ember"
          />
        </div>

        <Toggle
          label="Animaciones"
          description="Movimientos, capturas y efectos visuales fluidos."
          checked={settings.animationsOn}
          onChange={(v) => update("animationsOn", v)}
        />
        <Toggle
          label="Confirmar antes de abandonar"
          description="Pide confirmación si sales de una partida en curso."
          checked={settings.confirmBeforeLeaving}
          onChange={(v) => update("confirmBeforeLeaving", v)}
        />
      </div>

      <Button variant="secondary" onClick={() => router.push("/")}>
        Volver al menú
      </Button>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-parchment">{label}</p>
        <p className="text-xs text-parchment/45">{description}</p>
      </div>
      <span
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-ember" : "bg-void-raised"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-parchment transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </label>
  );
}
