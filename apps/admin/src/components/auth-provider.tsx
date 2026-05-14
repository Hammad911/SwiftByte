"use client";

import { DEFAULT_API_URL } from "@swiftbite/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const STORAGE_KEY = "swiftbite_admin_jwt";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  riderApproved: boolean;
  suspended: boolean;
  phone: string | null;
};

type AuthCtx = {
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  setSession: (token: string, user: AuthUser) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (typeof window === "undefined") return;
      const t = localStorage.getItem(STORAGE_KEY);
      if (!t) {
        if (!cancelled) setReady(true);
        return;
      }
      setToken(t);
      try {
        const r = await fetch(`${getApiBase()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        if (!r.ok) throw new Error("me");
        const data = (await r.json()) as { user: AuthUser };
        if (!cancelled) setUser(data.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSession = useCallback((t: string, u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, t);
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${getApiBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(body.error || "Login failed");
    const u = body.user as AuthUser;
    setSession(body.token as string, u);
    return u;
  }, [setSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ ready, token, user, login, logout, setSession }),
    [ready, token, user, login, logout, setSession]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
