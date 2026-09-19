import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#0E1015",
          panel: "#161A21",
          raised: "#1E232C",
          line: "#2A303B",
        },
        parchment: "#E9DDC3",
        walnut: {
          DEFAULT: "#3C2A1E",
          light: "#5A3F2C",
        },
        ember: {
          DEFAULT: "#C84B36",
          bright: "#E8623F",
          dim: "#7A2E22",
        },
        obsidian: {
          DEFAULT: "#181B20",
          bright: "#2C323D",
        },
        gold: {
          DEFAULT: "#C9A24B",
          bright: "#E6C878",
          dim: "#8A6F35",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        piece: "0 3px 0 rgba(0,0,0,0.45), 0 6px 10px rgba(0,0,0,0.35)",
        panel: "0 20px 60px rgba(0,0,0,0.45)",
        glow: "0 0 24px rgba(201,162,75,0.35)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 1.8s ease-in-out infinite",
        "pop-in": "pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
