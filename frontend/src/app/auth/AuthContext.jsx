import React, { createContext, useContext, useMemo, useState } from "react";
import { apiFetch } from "../../services/api.js";
import { clearAuth, loadAuth, saveAuth } from "./storage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadAuth());

  const value = useMemo(() => {
    const token = auth?.token ?? null;
    const user = auth?.user ?? null;

    return {
      token,
      user,
      async signup(payload) {
        const data = await apiFetch("/auth/signup", { method: "POST", body: payload });
        const next = { token: data.token, user: data.user };
        saveAuth(next);
        setAuth(next);
      },
      async login(payload) {
        const data = await apiFetch("/auth/login", { method: "POST", body: payload });
        const next = { token: data.token, user: data.user };
        saveAuth(next);
        setAuth(next);
      },
      logout() {
        clearAuth();
        setAuth(null);
      },
    };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

