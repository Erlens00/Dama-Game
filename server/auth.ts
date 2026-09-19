import crypto from "crypto";
import { createUser, findUser, userExists, type UserRecord } from "./db";

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function isValidUsername(name: string): boolean {
  return /^[a-zA-Z0-9_ ]{3,20}$/.test(name.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= 4 && password.length <= 64;
}

export function isValidCountryCode(code: string): boolean {
  return /^[A-Za-z]{2}$/.test(code);
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: UserRecord;
  token?: string;
}

// token -> username (clave en minúsculas). En memoria: se pierde al reiniciar el servidor.
const sessions = new Map<string, string>();

export function register(displayName: string, password: string, country: string): AuthResult {
  const name = displayName.trim();
  if (!isValidUsername(name)) {
    return { ok: false, error: "El nombre debe tener entre 3 y 20 caracteres (letras, números o espacios)." };
  }
  if (!isValidPassword(password)) {
    return { ok: false, error: "La contraseña debe tener al menos 4 caracteres." };
  }
  const key = name.toLowerCase();
  if (userExists(key)) {
    return { ok: false, error: "Ese nombre ya está en uso." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const user: UserRecord = {
    key,
    displayName: name,
    passwordHash: hashPassword(password, salt),
    salt,
    country: isValidCountryCode(country) ? country.toUpperCase() : "UN",
    stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, currentStreak: 0, bestStreak: 0 },
    createdAt: Date.now(),
  };
  createUser(user);

  const token = crypto.randomUUID();
  sessions.set(token, key);
  return { ok: true, user, token };
}

export function login(displayName: string, password: string): AuthResult {
  const key = displayName.trim().toLowerCase();
  const user = findUser(key);
  if (!user) return { ok: false, error: "No existe una cuenta con ese nombre." };
  const attempt = hashPassword(password, user.salt);
  if (attempt !== user.passwordHash) return { ok: false, error: "Contraseña incorrecta." };

  const token = crypto.randomUUID();
  sessions.set(token, key);
  return { ok: true, user, token };
}

export function resolveSession(token: string | undefined | null): UserRecord | null {
  if (!token) return null;
  const key = sessions.get(token);
  if (!key) return null;
  return findUser(key);
}

export function destroySession(token: string): void {
  sessions.delete(token);
}
