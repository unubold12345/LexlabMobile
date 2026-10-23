import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { apiUrl } from "@/lib/api";

const TOKEN_KEY = "lexlab.auth.token.v1";
const USER_KEY = "lexlab.auth.user.v1";

export type AuthUser = {
  id: string;
  name: string | null;
  phone: string | null;
  role?: string;
  paidAt?: string | null;
  hasPaid?: boolean;
  createdAt?: string;
};

type AuthValue = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  signingIn: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthValue | null>(null);

const webStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

const nativeStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const storage = Platform.OS === "web" ? webStorage : nativeStorage;

function parseUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.id !== "string" || !u.id) return null;
  return {
    id: u.id,
    name: typeof u.name === "string" ? u.name : null,
    phone: typeof u.phone === "string" ? u.phone : null,
    role: typeof u.role === "string" ? u.role : undefined,
    paidAt: typeof u.paidAt === "string" ? u.paidAt : null,
    hasPaid: typeof u.hasPaid === "boolean" ? u.hasPaid : undefined,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const persist = useCallback(async (nextToken: string | null, nextUser: AuthUser | null) => {
    try {
      if (nextToken) await storage.setItem(TOKEN_KEY, nextToken);
      else await storage.removeItem(TOKEN_KEY);
      if (nextUser) await storage.setItem(USER_KEY, JSON.stringify(nextUser));
      else await storage.removeItem(USER_KEY);
    } catch {}
  }, []);

  const applySession = useCallback(
    (nextToken: string | null, nextUser: AuthUser | null) => {
      setToken(nextToken);
      setUserState(nextUser);
      void persist(nextToken, nextUser);
    },
    [persist]
  );

  const signOut = useCallback(async () => {
    setToken(null);
    setUserState(null);
    await persist(null, null);
  }, [persist]);

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return fetch(apiUrl(path), { ...init, headers });
    },
    [token]
  );

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await apiFetch("/api/profile", { signal: controller.signal });
      clearTimeout(timer);
      if (res.status === 401) {
        await signOut();
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as Record<string, unknown>;
      const next = parseUser({ ...data, id: user?.id ?? data.id, hasPaid: data.role === "ADMIN" || !!data.paidAt });
      if (next) {
        setUserState(next);
        void persist(token, next);
      }
    } catch {}
  }, [apiFetch, persist, signOut, token, user?.id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([storage.getItem(TOKEN_KEY), storage.getItem(USER_KEY)]);
        if (!alive) return;
        if (savedToken) {
          setToken(savedToken);
          if (savedUser) setUserState(parseUser(JSON.parse(savedUser)));
        }
      } catch {}
      if (alive) setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !token) return;
    void refreshUser();
    // only on boot / token change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token]);

  const signIn = useCallback(
    async (phone: string, password: string) => {
      setSigningIn(true);
      try {
        const res = await fetch(apiUrl("/api/mobile/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });
        const data = (await res.json().catch(() => ({}))) as { token?: string; user?: unknown; error?: string };
        if (!res.ok || !data.token) throw new Error(data.error || "Нэвтрэх боломжгүй");
        const nextUser = parseUser(data.user);
        if (!nextUser) throw new Error("Хэрэглэгчийн мэдээлэл буруу байна");
        applySession(data.token, nextUser);
      } finally {
        setSigningIn(false);
      }
    },
    [applySession]
  );

  const setUser = useCallback(
    (next: AuthUser | null) => {
      setUserState(next);
      if (token) void persist(token, next);
    },
    [persist, token]
  );

  const value = useMemo<AuthValue>(
    () => ({ token, user, hydrated, signingIn, signIn, signOut, refreshUser, setUser, apiFetch }),
    [token, user, hydrated, signingIn, signIn, signOut, refreshUser, setUser, apiFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
