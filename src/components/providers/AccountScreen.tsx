"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { countryCodeToFlag } from "@/lib/utils/flags";

export function AccountScreen() {
  const { register, login } = useAuth();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result =
      mode === "register" ? await register(name, password, country || "UN") : await login(name, password);
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Algo salió mal.");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <h1 className="font-display text-4xl text-parchment">Dama AI</h1>
        <p className="max-w-xs text-sm text-parchment/50">
          Crea una cuenta para guardar tus estadísticas, aparecer en el ranking global y jugar online con otras
          personas.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-void-line bg-void-panel p-6"
      >
        <div className="flex rounded-xl bg-void-raised p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-lg py-2 transition-colors ${
              mode === "register" ? "bg-ember text-white" : "text-parchment/60"
            }`}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg py-2 transition-colors ${
              mode === "login" ? "bg-ember text-white" : "text-parchment/60"
            }`}
          >
            Iniciar sesión
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-parchment/60">Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={20}
            placeholder="Tu nombre"
            className="rounded-lg border border-void-line bg-void px-3 py-2 text-parchment outline-none focus:border-gold/60"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-parchment/60">Contraseña</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            minLength={4}
            placeholder="••••••"
            className="rounded-lg border border-void-line bg-void px-3 py-2 text-parchment outline-none focus:border-gold/60"
          />
        </label>

        {mode === "register" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-parchment/60">País (código de 2 letras, opcional)</span>
            <div className="flex items-center gap-2">
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value.slice(0, 2))}
                placeholder="CL"
                maxLength={2}
                className="w-20 rounded-lg border border-void-line bg-void px-3 py-2 text-center uppercase text-parchment outline-none focus:border-gold/60"
              />
              <span className="text-2xl">{country.length === 2 ? countryCodeToFlag(country) : "🏳️"}</span>
            </div>
          </label>
        )}

        {error && <p className="text-sm text-ember-bright">{error}</p>}

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Un momento..." : mode === "register" ? "Crear cuenta" : "Entrar"}
        </Button>
      </motion.form>
    </div>
  );
}
