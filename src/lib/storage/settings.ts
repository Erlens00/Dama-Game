export interface AppSettings {
  soundOn: boolean;
  musicOn: boolean;
  volume: number; // 0..1
  animationsOn: boolean;
  theme: "obsidian" | "walnut";
  confirmBeforeLeaving: boolean;
}

const STORAGE_KEY = "dama-ai:settings";

export const DEFAULT_SETTINGS: AppSettings = {
  soundOn: true,
  musicOn: false,
  volume: 0.6,
  animationsOn: true,
  theme: "obsidian",
  confirmBeforeLeaving: true,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage puede fallar en modo privado; degradar en silencio.
  }
}
