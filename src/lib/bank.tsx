import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SEED_QUESTIONS } from "@/data/seed";
import { useAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import type { BankQuestion, MainGroup } from "@/lib/types";

const LIVE_URL = apiUrl("/api/questions?full=1");
const PROD_URL = "https://lawtest-rho.vercel.app/api/questions?full=1";
const CACHE_PREFIX = "lexlab.bank.v2";

type RawQuestion = {
  id?: string;
  question?: string;
  options?: string[];
  answer?: number | number[] | null;
  category?: string;
  subCategory?: string;
  explanation?: string;
  lawRef?: string;
  difficulty?: string;
};

function normalize(raw: RawQuestion): BankQuestion | null {
  if (!raw || typeof raw.question !== "string" || !Array.isArray(raw.options)) return null;
  if (raw.options.length < 2) return null;
  if (typeof raw.answer !== "number") return null;
  if (raw.answer < 0 || raw.answer >= raw.options.length) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) return null;
  const category = raw.category?.trim() || "Бусад";
  const subCategory = raw.subCategory?.trim() || "Ерөнхий";
  return {
    id,
    category,
    subCategory,
    question: raw.question.trim(),
    options: raw.options,
    answer: raw.answer,
    explanation: raw.explanation?.trim() || "",
    lawRef: raw.lawRef?.trim() || "",
    difficulty: raw.difficulty || "medium",
  };
}

async function fetchQuestions(url: string, token: string | null, timeoutMs: number): Promise<BankQuestion[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(url, { signal: controller.signal, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { questions?: RawQuestion[] };
    const normalized = (data.questions || [])
      .map((q) => normalize(q))
      .filter((q): q is BankQuestion => q !== null);
    if (normalized.length === 0) throw new Error("empty");
    return [...new Map(normalized.map((q) => [q.id, q])).values()];
  } finally {
    clearTimeout(timer);
  }
}

function sortMains(a: string, b: string): number {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  if (!Number.isNaN(na) && Number.isNaN(nb)) return -1;
  if (Number.isNaN(na) && !Number.isNaN(nb)) return 1;
  return a.localeCompare(b);
}

type BankValue = {
  questions: BankQuestion[];
  mains: MainGroup[];
  total: number;
  syncing: boolean;
  live: boolean;
  syncedAt: number | null;
  lastError: string | null;
  refresh: () => Promise<void>;
  byMain: (main: string, sub?: string) => BankQuestion[];
};

const BankContext = createContext<BankValue | null>(null);

export function BankProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [questions, setQuestions] = useState<BankQuestion[]>(SEED_QUESTIONS);
  const [syncing, setSyncing] = useState(false);
  const [live, setLive] = useState(false);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const mounted = useRef(true);
  const questionsRef = useRef(questions);
  const cacheKey = `${CACHE_PREFIX}:${auth.user?.id ?? "guest"}`;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const attempts: { url: string; token: string | null; timeout: number }[] = [
        { url: LIVE_URL, token: auth.token, timeout: 12000 },
      ];
      if (PROD_URL !== LIVE_URL) {
        attempts.push({ url: PROD_URL, token: auth.token, timeout: 20000 });
        if (auth.token) attempts.push({ url: PROD_URL, token: null, timeout: 20000 });
      }

      let unique: BankQuestion[] | null = null;
      for (const attempt of attempts) {
        try {
          unique = await fetchQuestions(attempt.url, attempt.token, attempt.timeout);
          break;
        } catch {
          // try the next endpoint
        }
      }
      if (!mounted.current) return;
      if (!unique) {
        setLastError("Асуултын сан татагдсангүй. Офлайн сан ашиглаж байна.");
        return;
      }

      const accepted = unique.length >= questionsRef.current.length ? unique : questionsRef.current;
      questionsRef.current = accepted;
      setQuestions(accepted);
      setLive(true);
      setSyncedAt(Date.now());
      setLastError(null);
      if (accepted === unique) {
        AsyncStorage.setItem(cacheKey, JSON.stringify(unique)).catch(() => {});
      }
    } finally {
      if (mounted.current) setSyncing(false);
    }
  }, [auth.token, cacheKey]);

  useEffect(() => {
    if (!auth.hydrated) return;
    let alive = true;
    setQuestions(SEED_QUESTIONS);
    questionsRef.current = SEED_QUESTIONS;
    setLive(false);
    setSyncedAt(null);
    setLastError(null);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw && alive) {
          const cached = JSON.parse(raw) as BankQuestion[];
          if (Array.isArray(cached) && cached.length > 0) {
            setQuestions(cached);
            questionsRef.current = cached;
            setSyncedAt(Date.now());
          }
        }
      } catch {}
      if (alive) refresh();
    })();
    return () => {
      alive = false;
    };
  }, [auth.hydrated, cacheKey, refresh]);

  const mains = useMemo<MainGroup[]>(() => {
    const map = new Map<string, Map<string, number>>();
    for (const q of questions) {
      if (!map.has(q.category)) map.set(q.category, new Map());
      const subs = map.get(q.category)!;
      subs.set(q.subCategory, (subs.get(q.subCategory) || 0) + 1);
    }
    return [...map.entries()]
      .map(([name, subs]) => ({
        name,
        total: [...subs.values()].reduce((a, b) => a + b, 0),
        subs: [...subs.entries()]
          .map(([subName, count]) => ({ name: subName, count }))
          .sort((a, b) => a.name.localeCompare(b.name, "mn")),
      }))
      .sort((a, b) => {
        const byName = sortMains(a.name, b.name);
        return byName !== 0 ? byName : b.total - a.total;
      });
  }, [questions]);

  const byMain = useCallback(
    (main: string, sub?: string) =>
      questions.filter((q) => (main === "all" || q.category === main) && (!sub || q.subCategory === sub)),
    [questions]
  );

  const value = useMemo<BankValue>(
    () => ({
      questions,
      mains,
      total: questions.length,
      syncing,
      live,
      syncedAt,
      lastError,
      refresh,
      byMain,
    }),
    [questions, mains, syncing, live, syncedAt, lastError, refresh, byMain]
  );

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank(): BankValue {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error("useBank must be used inside BankProvider");
  return ctx;
}
