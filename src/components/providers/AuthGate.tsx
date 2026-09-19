"use client";

import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { AccountScreen } from "./AccountScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    );
  }

  if (!profile) return <AccountScreen />;

  return <>{children}</>;
}
