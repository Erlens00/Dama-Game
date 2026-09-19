import fs from "fs";
import path from "path";

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
}

export interface UserRecord {
  /** clave (minúsculas) */
  key: string;
  /** nombre mostrado tal como el usuario lo escribió */
  displayName: string;
  passwordHash: string;
  salt: string;
  /** código de país de 2 letras (ISO 3166-1 alpha-2), p. ej. "CL" */
  country: string;
  stats: UserStats;
  createdAt: number;
}

interface DbShape {
  users: Record<string, UserRecord>;
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function readDb(): DbShape {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as DbShape;
  } catch {
    return { users: {} };
  }
}

function writeDb(db: DbShape): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// Cache en memoria + escritura perezosa para no golpear el disco en cada lectura.
let cache: DbShape | null = null;
let writeScheduled = false;

function getDb(): DbShape {
  if (!cache) cache = readDb();
  return cache;
}

function scheduleWrite() {
  if (writeScheduled) return;
  writeScheduled = true;
  setTimeout(() => {
    writeScheduled = false;
    if (cache) writeDb(cache);
  }, 50);
}

export function findUser(key: string): UserRecord | null {
  return getDb().users[key.toLowerCase()] ?? null;
}

export function userExists(key: string): boolean {
  return !!findUser(key);
}

export function createUser(record: UserRecord): void {
  const db = getDb();
  db.users[record.key] = record;
  scheduleWrite();
}

export function updateUser(key: string, updater: (user: UserRecord) => UserRecord): UserRecord | null {
  const db = getDb();
  const existing = db.users[key.toLowerCase()];
  if (!existing) return null;
  const updated = updater(existing);
  db.users[key.toLowerCase()] = updated;
  scheduleWrite();
  return updated;
}

export function allUsers(): UserRecord[] {
  return Object.values(getDb().users);
}

export function publicProfile(user: UserRecord) {
  return {
    name: user.displayName,
    country: user.country,
    stats: user.stats,
  };
}
