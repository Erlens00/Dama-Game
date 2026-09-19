# Dama AI

Juego de damas con una **variante de reglas personalizada** (fichas normales que solo avanzan, nunca retroceden — ni siquiera al capturar — y reyes "voladores" que pueden moverse y capturar varias casillas en cualquier diagonal), jugado contra una IA real (minimax + poda alfa-beta) con tres niveles de dificultad.

Construido con **Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS + Framer Motion**.

## Requisitos

- Node.js 18.18 o superior (recomendado 20+)
- npm 9+

## Puesta en marcha (modo local, contra la IA)

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El comando `dev` ahora levanta un **servidor propio** (`server.ts`) que sirve las páginas de Next.js y además atiende Socket.io en el mismo puerto — es lo que hace posible el multijugador online (ver más abajo). Ya no se usa `next dev` directamente.

Otros comandos:

```bash
npm run build   # build de producción de Next.js
npm run start   # levanta el servidor propio (server.ts) en modo producción
npm run lint    # ESLint
npm test        # pruebas unitarias de la lógica del juego (Vitest)
```

> Este proyecto se generó sin acceso a internet en el entorno de desarrollo, por lo que **no se pudo ejecutar `npm install` ni un build/servidor real** antes de la entrega. El código puro (`src/lib/**`, `server/**`) sí se verificó de forma aislada con `tsc --noEmit` y compila sin errores de tipos propios (los únicos errores restantes son "módulo no encontrado" para paquetes que se instalan con `npm install`, como `socket.io` o `vitest`). Los componentes de React y el servidor no se han podido ejecutar de extremo a extremo — corre `npm install && npm run dev` como primer paso y avísame si algo no encaja para corregirlo.

## Jugar online (multijugador real)

Esto necesita el servidor corriendo (`npm run dev` o `npm start`) — no es un modo simulado.

1. Al entrar a la aplicación, **crear una cuenta es obligatorio** (nombre + contraseña, país opcional). Sin cuenta no se puede usar nada de la app.
2. Desde el menú, **Jugar Online** lleva al lobby: podés **crear una sala** (pública, o privada con una contraseña de 6 dígitos) o **unirte** a una con su ID (+ contraseña si es privada). Las salas públicas también aparecen listadas para que cualquiera se una con un clic — si ya está llena, se avisa y no deja entrar.
3. Dentro de la sala hay un **chat** mientras esperan. El anfitrión decide cuándo **iniciar la partida**; en ese momento se asigna **negro o rojo al azar** a cada jugador (negro siempre mueve primero — ver nota de nomenclatura abajo).
4. Los movimientos se validan **en el servidor** (mismo motor de reglas que el modo IA — sección 41 del documento original), y se transmiten a ambos jugadores, animando cada salto del combo igual que en local.
5. Al terminar, cualquiera puede **salir**, y el anfitrión puede pedir la **revancha** (vuelve a barajar los colores).
6. Durante la partida se ve el nombre, país y racha de victorias actual de ambos jugadores.

**Nota de nomenclatura:** internamente el juego sigue usando los colores "negro" y "rojo" de todo el resto de la app (para no duplicar todo el sistema visual de fichas). Cuando se randomiza el color de cada jugador, es entre estos dos — no se agregó un tablero "blanco/negro" en paralelo.

### Cuentas, perfiles y ranking

- El registro guarda nombre, contraseña (con hash `scrypt`, nunca en texto plano) y país, en un archivo `data/db.json` (sin base de datos externa).
- Cualquiera puede ver el **perfil público** de cualquier jugador (partidas jugadas, victorias, derrotas, % de victorias, racha actual y mejor racha) desde `/profile/<nombre>`, buscándolo desde tu propio perfil o tocando un nombre en el ranking.
- El **ranking global** (`/leaderboard`) tiene tres categorías — más partidas jugadas, más victorias, mayor racha — hasta 100 puestos cada una, y se recalcula como máximo una vez cada 24 h (se cachea en memoria en el servidor).

### Limitaciones honestas de esta primera versión

- **Las salas viven en memoria del servidor**: si el proceso se reinicia, todas las salas activas (no las cuentas, esas sí están en `data/db.json`) desaparecen.
- **No hay reconexión**: si recargás la página estando dentro de una sala, perdés la conexión con ella (Socket.io te da una nueva conexión) y hay que volver a unirse por ID desde el lobby. No implementé recuperación de sesión de sala.
- **Jugar por internet con alguien en otra red** requiere desplegar este servidor en algún lugar accesible por ambos (un VPS, Render, Railway, Fly.io...) — un hosting puramente estático (como Vercel sin configuración adicional) no alcanza porque esto necesita una conexión persistente (WebSocket) y proceso de Node corriendo. En la misma red local (o en `localhost` con dos pestañas/perfiles), funciona tal cual.
- Las contraseñas de sala son de 6 dígitos como pediste; no hay límite de intentos ni protección contra fuerza bruta más allá de lo básico — para un juego entre amigos es suficiente, no lo trataría como seguridad real.

## Arquitectura

```
server.ts                Servidor propio: sirve Next.js + adjunta Socket.io al mismo puerto
server/
  db.ts                   "Base de datos" en archivo JSON (cuentas + estadísticas)
  auth.ts                 Hash de contraseñas (scrypt) y tokens de sesión en memoria
  rooms.ts                Salas en memoria: crear/unir/mover/chat, usando el MISMO motor de reglas
  leaderboard.ts           Ranking top-100 por categoría, con caché de 24h
  socketHandlers.ts        Conecta todos los eventos de Socket.io con lo anterior
src/
  app/                  Rutas (App Router): inicio, /play, /online, /profile, /leaderboard, /settings, /stats
  components/
    board/              Tablero, casillas y fichas (visual, animado; reutilizado en local Y online)
    ui/                 Button, Modal (genéricos, sin lógica de juego)
    game/                HUD, combo, selector de dificultad, modal de resultado, "¡SOBREVIVE!"
    online/              Chat de sala, insignia de jugador (nombre/país/racha)
    providers/            AuthProvider (contexto de sesión) + AuthGate (pantalla de cuenta obligatoria)
    screens/             Pantalla de inicio
  hooks/
    useGame.ts           Conecta GameManager (motor puro) con React + IA + sonido + stats, modo local
    useOnlineRoom.ts      Conecta el estado de una sala remota con React vía Socket.io
  lib/
    game/
      types.ts            Tipos centrales (única fuente de verdad de forma de datos)
      config.ts            Configuración central (tamaño de tablero, direcciones, captura opcional)
      board.ts             Creación y utilidades de tablero
      moveValidator.ts     getLegalMoveSet / getCaptureOptions — TODA la validación de reglas
      gameManager.ts       Orquesta turnos, combos, coronación, fin de partida (modo local, sin red)
      winConditions.ts     Reglas de victoria/empate
      replay.ts             Reconstruye los tableros intermedios de una jugada ya completa (animación online)
    ai/
      evaluate.ts           Heurística de evaluación de tablero
      minimax.ts             Negamax + poda alfa-beta + búsqueda iterativa por tiempo
      difficulty.ts           Tabla de ajustes por dificultad (profundidad, tiempo, error, margen)
      aiPlayer.ts              Selección de jugada de la IA según dificultad
    audio/soundManager.ts   Sonidos sintetizados con Web Audio API (sin archivos binarios)
    storage/                 settings.ts y stats.ts (localStorage, modo local sin cuenta)
    net/                     Cliente de Socket.io + tipos compartidos con el servidor
    utils/flags.ts            Código de país (2 letras) → emoji de bandera
tests/
  gameLogic.test.ts        Pruebas de movimiento, capturas, combos, coronación, victoria/empate
```

La lógica del juego (`src/lib/game` y `src/lib/ai`) **no importa React ni nada visual**, y es exactamente la misma que corre en el servidor (`server/rooms.ts` la importa directamente) para validar cada jugada online — así el motor nunca puede hacer, ni aceptar del cliente, un movimiento ilegal, tal como pedía la sección 41 del documento original.

## Reglas implementadas

- Fichas normales: solo avanzan en diagonal, un paso, nunca retroceden (ni para capturar).
- **Comer es opcional**: cualquier ficha puede moverse normalmente aunque tenga una captura disponible.
- Capturas: la ficha normal captura a un espacio de distancia. El **rey captura "al vuelo"**: no necesita estar pegado al enemigo, puede comerlo desde cualquier distancia mientras el camino esté vacío, y elige entre cualquier casilla libre más allá como aterrizaje.
- Combos: si tras una captura la misma ficha puede seguir capturando, esas opciones se muestran **todas de una vez**, sin esperar a que captures la primera pieza. **Cualquier ficha** (normal o rey) puede elegir detenerse en cualquier punto del combo.
- Al elegir un destino, la ficha se anima pasando visualmente por cada casilla intermedia del camino, no salta directo al final — también en las partidas online.
- Coronación inmediata al llegar a la última fila, incluso a mitad de un combo.
- Victoria: **hay que capturar todas las fichas del rival** (ya no existe la regla de "única ficha restante"). También se gana si al rival, en su turno, no le queda ningún movimiento legal.
- **Fase de solo-reyes ("¡SOBREVIVE!")**: si ambos bandos se quedan sin ninguna ficha normal (solo reyes), aparece un aviso a pantalla completa con una cuenta regresiva de 3 segundos, y se activa una mecánica anti-estancamiento: cada casilla que una ficha desocupa al moverse queda marcada con una X y bloqueada para siempre (nadie puede pisarla ni atravesarla). Esto reduce el tablero con cada jugada y garantiza que la partida termine: alguien acaba sin movimientos (pierde) o se capturan todos los reyes rivales.
- IA: mismo motor de reglas (`getLegalMoveSet`) que el jugador humano — nunca puede hacer un movimiento que sea ilegal para el jugador, y respeta las mismas casillas bloqueadas.

## Supuestos tomados (el documento original no los especificaba explícitamente)

1. **Captura opcional** (por indicación explícita del usuario): `GAME_CONFIG.mandatoryCapture` está en `false` por defecto en `src/lib/game/config.ts`.
2. **Sin movimientos legales = derrota**: si al jugador en turno no le queda ningún movimiento posible, pierde la partida. Es también la vía natural de resolución de la fase de solo-reyes.
3. Sonidos: en vez de archivos de audio binarios, se sintetizan tonos cortos con la Web Audio API (`soundManager.ts`). Es 100% funcional sin depender de assets externos y es trivial de sustituir por archivos `.mp3` reales en `public/sounds/` si se prefiere.
4. **Colores online**: se randomiza entre "negro" y "rojo" (los mismos colores de todo el juego) en vez de introducir un tablero blanco/negro paralelo — ver la nota de nomenclatura más arriba.
5. **Cuenta obligatoria desde la entrada**: la pantalla de cuenta bloquea TODA la app (incluido el modo local contra la IA), tal como se pidió, no solo el modo online.

## Rendimiento de la IA

La búsqueda usa `negamax` con poda alfa-beta y ordenamiento de movimientos (capturas primero). Cada dificultad cambia la profundidad real de búsqueda y la probabilidad de "error" deliberado — nunca es solo un `setTimeout` disfrazado de IA:

| Dificultad | Profundidad máxima | Presupuesto de tiempo | Prob. de error | Margen de candidatos |
|---|---|---|---|---|
| Fácil | 2 | 200 ms | 35% | 140 |
| Media | 4 | 500 ms | 12% | 60 |
| Difícil | 7 | 1.8 s | 2% | 15 |
| **Extremo** | 12 | 4.5 s | 0% (nunca) | 0 (siempre el mejor) |

La búsqueda usa **iterative deepening**: repite la búsqueda a profundidad 1, 2, 3... cediendo el hilo principal entre cada nivel, hasta agotar el presupuesto de tiempo o llegar a la profundidad máxima. Así "Extremo" planifica varias jugadas por delante (no solo evalúa la posición inmediata) sin congelar la interfaz, y siempre juega su mejor movimiento encontrado, sin errores deliberados.

Antes de buscar, se cede el hilo principal (`await` + `setTimeout(0)`) para no congelar la interfaz; si en el futuro la profundidad "Difícil" se aumenta más, el siguiente paso natural es mover `searchRootMoves` a un Web Worker (mencionado en la sección 40).

## Ideas para seguir (no implementadas)

- Reconexión a una sala tras recargar la página (requiere sesiones de sala persistentes, no solo por `socket.id`).
- Espectadores en una sala, invitaciones directas, partidas privadas por link.
- Mover la búsqueda "Extremo" a un Web Worker para profundidades todavía mayores sin ningún riesgo de bloquear la pestaña.
- Migrar `data/db.json` a una base de datos real (Postgres/SQLite) si el número de cuentas crece mucho.
