export type SoundEvent =
  | "click"
  | "select"
  | "move"
  | "capture"
  | "combo"
  | "king"
  | "victory"
  | "defeat"
  | "draw"
  | "error";

interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
  delay?: number;
  gain?: number;
}

const SOUND_MAP: Record<SoundEvent, Tone[]> = {
  click: [{ freq: 520, duration: 0.05, type: "triangle" }],
  select: [{ freq: 660, duration: 0.06, type: "sine" }],
  move: [{ freq: 340, duration: 0.08, type: "sine" }],
  capture: [
    { freq: 180, duration: 0.07, type: "square" },
    { freq: 120, duration: 0.09, type: "square", delay: 0.05 },
  ],
  combo: [
    { freq: 500, duration: 0.06, type: "triangle" },
    { freq: 700, duration: 0.08, type: "triangle", delay: 0.07 },
  ],
  king: [
    { freq: 440, duration: 0.09, type: "sine" },
    { freq: 660, duration: 0.09, type: "sine", delay: 0.09 },
    { freq: 880, duration: 0.16, type: "sine", delay: 0.18 },
  ],
  victory: [
    { freq: 523, duration: 0.12, type: "triangle" },
    { freq: 659, duration: 0.12, type: "triangle", delay: 0.12 },
    { freq: 784, duration: 0.12, type: "triangle", delay: 0.24 },
    { freq: 1047, duration: 0.28, type: "triangle", delay: 0.36 },
  ],
  defeat: [
    { freq: 400, duration: 0.16, type: "sawtooth" },
    { freq: 320, duration: 0.16, type: "sawtooth", delay: 0.15 },
    { freq: 220, duration: 0.3, type: "sawtooth", delay: 0.3 },
  ],
  draw: [
    { freq: 440, duration: 0.14, type: "sine" },
    { freq: 440, duration: 0.14, type: "sine", delay: 0.16 },
  ],
  error: [{ freq: 150, duration: 0.1, type: "square", gain: 0.25 }],
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.6;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  play(event: SoundEvent) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    for (const tone of SOUND_MAP[event]) {
      const startAt = ctx.currentTime + (tone.delay ?? 0);
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = tone.type ?? "sine";
      osc.frequency.setValueAtTime(tone.freq, startAt);

      const peakGain = (tone.gain ?? 0.35) * this.volume;
      gainNode.gain.setValueAtTime(0, startAt);
      gainNode.gain.linearRampToValueAtTime(peakGain, startAt + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + tone.duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + tone.duration + 0.02);
    }
  }
}

export const soundManager = new SoundManager();
