"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AdminUser } from "@/lib/types";

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => undefined
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const response = await fetch("/api/v1/auth/me", { cache: "no-store" });

    if (!response.ok) {
      setUser(null);
      return;
    }

    const payload = await response.json();
    setUser(payload.data ?? null);
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ user, loading, refreshUser }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
