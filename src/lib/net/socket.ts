"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/** Conexión única y compartida de Socket.io. Se crea perezosamente, con el token guardado (si existe). */
export function getSocket(): Socket {
  if (socket) return socket;
  const token = typeof window !== "undefined" ? window.localStorage.getItem("dama-ai:token") : null;
  socket = io({
    autoConnect: true,
    auth: token ? { token } : {},
    transports: ["websocket", "polling"],
  });
  return socket;
}

/** Reconecta el socket usando un nuevo token (tras iniciar sesión / registrarse). */
export function reconnectWithToken(token: string) {
  window.localStorage.setItem("dama-ai:token", token);
  if (socket) {
    socket.auth = { token };
  }
}

export function clearSession() {
  window.localStorage.removeItem("dama-ai:token");
}

/** Llama a un evento del servidor que responde con un callback (ack) y lo envuelve en una Promise. */
export function call<TPayload, TResponse>(event: string, payload?: TPayload): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    const timeout = setTimeout(() => reject(new Error("Tiempo de espera agotado. Revisa tu conexión.")), 10000);
    s.emit(event, payload ?? {}, (response: TResponse) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}
