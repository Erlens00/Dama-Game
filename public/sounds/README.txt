Esta carpeta se deja preparada para futuros archivos de audio (música, efectos más elaborados).

Por defecto, el juego NO necesita ningún archivo aquí: los efectos de sonido se generan en tiempo real
con la Web Audio API (ver `src/lib/audio/soundManager.ts`). Si quieres usar archivos reales, colócalos
aquí (por ejemplo `click.mp3`, `capture.mp3`, `victory.mp3`) y adapta `soundManager.ts` para reproducirlos
con `new Audio('/sounds/nombre.mp3')` en lugar de sintetizar el tono.
