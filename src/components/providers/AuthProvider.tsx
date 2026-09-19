"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { call, clearSession, getSocket, reconnectWithToken } from "@/lib/net/socket";
import type { AuthResponse, PublicProfile } from "@/lib/net/types";

interface AuthContextValue {
  profile: PublicProfile | null;
  loading: boolean;
  register: (name: string, password: string, country: string) => Promise<{ ok: boolean; error?: string }>;
  login: (name: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setCountry: (country: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      getSocket(); // asegura la conexión (con el token guardado, si existe)
      const res = await call<undefined, { ok: boolean; profile?: PublicProfile }>("auth:me");
      setProfile(res.ok && res.profile ? res.profile : null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = useCallback(async (name: string, password: string, country: string) => {
    const res = await call<{ name: string; password: string; country: string }, AuthResponse>("auth:register", {
      name,
      password,
      country,
    });
    if (res.ok && res.token && res.profile) {
      reconnectWithToken(res.token);
      setProfile(res.profile);
      return { ok: true };
    }
    return { ok: false, error: res.error ?? "No se pudo crear la cuenta." };
  }, []);

  const login = useCallback(async (name: string, password: string) => {
    const res = await call<{ name: string; password: string }, AuthResponse>("auth:login", { name, password });
    if (res.ok && res.token && res.profile) {
      reconnectWithToken(res.token);
      setProfile(res.profile);
      return { ok: true };
    }
    return { ok: false, error: res.error ?? "No se pudo iniciar sesión." };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setProfile(null);
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  const setCountry = useCallback(async (country: string) => {
    const res = await call<{ country: string }, { ok: boolean; profile?: PublicProfile }>("profile:setCountry", {
      country,
    });
    if (res.ok && res.profile) setProfile(res.profile);
  }, []);

  const value = useMemo(
    () => ({ profile, loading, register, login, logout, refreshProfile: checkSession, setCountry }),
    [profile, loading, register, login, logout, checkSession, setCountry]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
