import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { accuracy, computeXp, dayKey, levelOf, WEEKDAYS_MN } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import type { AnswerRow, HistoryItem, QuizMode } from "@/lib/types";

const KEY = "lexlab.progress.v1";

type State = {
  name: string;
  xp: number;
  solved: number;
  correct: number;
  sessions: number;
  minutes: number;
  days: string[];
  history: HistoryItem[];
  answered: Record<string, 1>;
  wrong: Record<string, 1>;
  bookmarks: string[];
  dailyGoal: number;
};

const INITIAL: State = {
  name: "Суралцагч",
  xp: 0,
  solved: 0,
  correct: 0,
  sessions: 0,
  minutes: 0,
  days: [],
  history: [],
  answered: {},
  wrong: {},
  bookmarks: [],
  dailyGoal: 40,
};

export type ServerProfile = {
  id: string;
  name: string | null;
  phone: string | null;
  role: string;
  paidAt: string | null;
  createdAt: string;
  hasPassword: boolean;
  stats: { attempts: number; avgPct: number | null; saved: number; notes: number; mistakes: number };
  mistakesWrongCount: number;
  attemptsRaw: { id: string; category: string; mode: string; score: number; total: number; elapsed: number; createdAt: string }[];
};

export function streakFromDays(days: string[]): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  const cursor = new Date();
  if (!set.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(dayKey(cursor))) return 0;
  }
  let n = 0;
  while (set.has(dayKey(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

type RecordPayload = {
  main: string;
  mode: QuizMode;
  seconds: number;
  rows: AnswerRow[];
};

type ProgressValue = State & {
  hydrated: boolean;
  streak: number;
  level: number;
  levelInto: number;
  levelSpan: number;
  accuracyPct: number;
  todaySessions: number;
  todayMinutes: number;
  week: { label: string; count: number; today: boolean }[];
  server: ServerProfile | null;
  serverSyncing: boolean;
  syncServer: () => Promise<void>;
  setName: (name: string) => void;
  setDailyGoal: (minutes: number) => void;
  recordResult: (payload: RecordPayload) => number;
  toggleBookmark: (id: string) => void;
  markWrong: (id: string) => void;
  removeWrong: (id: string) => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [state, setState] = useState<State>(INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const [server, setServer] = useState<ServerProfile | null>(null);
  const [serverSyncing, setServerSyncing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw && alive) {
          const parsed = JSON.parse(raw) as Partial<State>;
          setState((prev) => ({ ...prev, ...parsed }));
        }
      } catch {}
      if (alive) setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const syncServer = useCallback(async () => {
    if (!auth.token) return;
    setServerSyncing(true);
    try {
      const [profileRes, mistakesRes] = await Promise.all([
        auth.apiFetch("/api/profile"),
        auth.apiFetch("/api/mistakes"),
      ]);
      if (!profileRes.ok) return;
      const profile = (await profileRes.json()) as ServerProfile;
      const mistakes = mistakesRes.ok
        ? ((await mistakesRes.json()) as { mistakes?: { questionId: string; wrongCount: number; manual: boolean }[] })
        : { mistakes: [] };

      const srvHistory: HistoryItem[] = (profile.attemptsRaw || []).map((a) => ({
        id: `srv-${a.id}`,
        main: a.category,
        mode: a.mode === "exam" ? "exam" : "practice",
        correct: a.score,
        wrong: Math.max(0, a.total - a.score),
        skipped: 0,
        total: a.total,
        xp: computeXp(a.score, a.total, a.mode === "exam" ? "exam" : "practice"),
        seconds: a.elapsed,
        at: Date.parse(a.createdAt) || Date.now(),
      }));

      setServer(profile);
      setState((prev) => {
        const local = prev.history.filter((h) => !h.id.startsWith("srv-"));
        const known = new Set(local.map((h) => `${h.at}:${h.total}:${h.correct}`));
        const fresh = srvHistory.filter((h) => !known.has(`${h.at}:${h.total}:${h.correct}`));
        const history = [...local, ...fresh].sort((a, b) => b.at - a.at).slice(0, 80);
        const wrong = { ...prev.wrong };
        for (const m of mistakes.mistakes || []) {
          if (m.wrongCount > 0 || m.manual) wrong[m.questionId] = 1;
        }
        const days = [...new Set([...prev.days, ...fresh.map((h) => dayKey(new Date(h.at)))])].slice(-400);
        return {
          ...prev,
          name: profile.name?.trim() || prev.name,
          wrong,
          days,
          history,
        };
      });
    } catch {
      // offline: local progress remains authoritative
    } finally {
      setServerSyncing(false);
    }
  }, [auth.token, auth.apiFetch]);

  useEffect(() => {
    if (auth.hydrated && auth.token) void syncServer();
    if (!auth.token) setServer(null);
  }, [auth.hydrated, auth.token, syncServer]);

  const setName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name: name.slice(0, 24) }));
  }, []);

  const setDailyGoal = useCallback((minutes: number) => {
    setState((prev) => ({ ...prev, dailyGoal: minutes }));
  }, []);

  const recordResult = useCallback(
    (payload: RecordPayload) => {
      const correct = payload.rows.filter((r) => r.status === "correct").length;
      const wrong = payload.rows.filter((r) => r.status === "wrong").length;
      const skipped = payload.rows.filter((r) => r.status === "skipped").length;
      const total = payload.rows.length;
      const xp = computeXp(correct, total, payload.mode);
      const category = payload.main;

      if (auth.token && payload.mode === "exam") {
        const answers: Record<string, number> = {};
        for (const row of payload.rows) {
          if (typeof row.choice === "number") answers[row.id] = row.choice;
        }
        const wrongIds = payload.rows.filter((r) => r.status === "wrong").map((r) => r.id);
        void auth
          .apiFetch("/api/attempts", {
            method: "POST",
            body: JSON.stringify({
              category,
              mode: payload.mode,
              score: correct,
              total,
              elapsed: payload.seconds,
              answers,
              questionIds: payload.rows.map((r) => r.id),
            }),
          })
          .then((res) => {
            if (!res.ok) return;
            setServer((prev) =>
              prev
                ? {
                    ...prev,
                    stats: { ...prev.stats, attempts: prev.stats.attempts + 1 },
                    attemptsRaw: [
                      {
                        id: `local-${Date.now()}`,
                        category,
                        mode: payload.mode,
                        score: correct,
                        total,
                        elapsed: payload.seconds,
                        createdAt: new Date().toISOString(),
                      },
                      ...prev.attemptsRaw,
                    ].slice(0, 500),
                  }
                : prev
            );
          })
          .catch(() => {});
        if (wrongIds.length > 0) {
          void auth
            .apiFetch("/api/mistakes", { method: "POST", body: JSON.stringify({ ids: wrongIds }) })
            .catch(() => {});
        }
      }

      setState((prev) => {
        const today = dayKey();
        const days = prev.days.includes(today) ? prev.days : [...prev.days, today].slice(-400);
        const answered = { ...prev.answered };
        const wrongMap = { ...prev.wrong };
        for (const row of payload.rows) {
          if (row.status === "correct") {
            answered[row.id] = 1;
            delete wrongMap[row.id];
          } else if (row.status === "wrong") {
            wrongMap[row.id] = 1;
          }
        }
        const item: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          main: payload.main,
          mode: payload.mode,
          correct,
          wrong,
          skipped,
          total,
          xp,
          seconds: payload.seconds,
          at: Date.now(),
        };
        return {
          ...prev,
          xp: prev.xp + xp,
          solved: prev.solved + correct + wrong,
          correct: prev.correct + correct,
          sessions: prev.sessions + 1,
          minutes: prev.minutes + Math.max(1, Math.round(payload.seconds / 60)),
          days,
          history: [item, ...prev.history].slice(0, 80),
          answered,
          wrong: wrongMap,
        };
      });
      return xp;
    },
    [auth.token, auth.apiFetch]
  );

  const toggleBookmark = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.includes(id) ? prev.bookmarks.filter((b) => b !== id) : [id, ...prev.bookmarks],
    }));
  }, []);

  const markWrong = useCallback(
    (id: string) => {
      setState((prev) => ({ ...prev, wrong: { ...prev.wrong, [id]: 1 } }));
      if (auth.token) {
        void auth
          .apiFetch("/api/mistakes", {
            method: "POST",
            body: JSON.stringify({ questionId: id, manual: true }),
          })
          .catch(() => {});
      }
    },
    [auth.token, auth.apiFetch]
  );

  const removeWrong = useCallback(
    (id: string) => {
      setState((prev) => {
        if (!prev.wrong[id]) return prev;
        const wrong = { ...prev.wrong };
        delete wrong[id];
        return { ...prev, wrong };
      });
      if (auth.token) {
        void auth
          .apiFetch(`/api/mistakes?questionId=${encodeURIComponent(id)}`, { method: "DELETE" })
          .catch(() => {});
      }
    },
    [auth.token, auth.apiFetch]
  );

  const reset = useCallback(() => setState((prev) => ({ ...INITIAL, name: prev.name })), []);

  const streak = useMemo(() => streakFromDays(state.days), [state.days]);
  const lvl = useMemo(() => levelOf(state.xp), [state.xp]);
  const today = dayKey();
  const todaySessions = useMemo(
    () => state.history.filter((h) => dayKey(new Date(h.at)) === today).length,
    [state.history, today]
  );
  const todayMinutes = useMemo(() => {
    const sec = state.history
      .filter((h) => dayKey(new Date(h.at)) === today)
      .reduce((sum, h) => sum + h.seconds, 0);
    return Math.round(sec / 60);
  }, [state.history, today]);

  const week = useMemo(() => {
    const out: { label: string; count: number; today: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      out.push({
        label: WEEKDAYS_MN[d.getDay()],
        count: state.history.filter((h) => dayKey(new Date(h.at)) === k).length,
        today: k === today,
      });
    }
    return out;
  }, [state.history, today]);

  const value = useMemo<ProgressValue>(
    () => ({
      ...state,
      hydrated,
      streak,
      level: lvl.level,
      levelInto: lvl.into,
      levelSpan: lvl.span,
      accuracyPct: accuracy(state.correct, state.solved),
      todaySessions,
      todayMinutes,
      week,
      server,
      serverSyncing,
      syncServer,
      setName,
      setDailyGoal,
      recordResult,
      toggleBookmark,
      markWrong,
      removeWrong,
      reset,
    }),
    [
      state,
      hydrated,
      streak,
      lvl,
      todaySessions,
      todayMinutes,
      week,
      server,
      serverSyncing,
      syncServer,
      setName,
      setDailyGoal,
      recordResult,
      toggleBookmark,
      markWrong,
      removeWrong,
      reset,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
