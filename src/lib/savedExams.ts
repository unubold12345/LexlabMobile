import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth";
import type { QuizMode } from "@/lib/types";

export type SavedExam = {
  key: string;
  tag: string;
  mode: QuizMode;
  minutes: number;
  ids: string[];
  answers: Record<string, number>;
  checked?: Record<string, 1>;
  optionOrder: Record<string, number[]>;
  idx: number;
  timeLeft: number;
  elapsed: number;
  updatedAt: number;
};

const PREFIX = "lexlab.saved.v1";

function storageKey(userId: string | null): string {
  return `${PREFIX}:${userId ?? "guest"}`;
}

function normalize(raw: unknown): SavedExam | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const ids = Array.isArray(row.ids) ? row.ids.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  if (ids.length === 0) return null;
  const answers: Record<string, number> = {};
  if (row.answers && typeof row.answers === "object" && !Array.isArray(row.answers)) {
    for (const [id, value] of Object.entries(row.answers as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isInteger(value)) answers[id] = value;
    }
  }
  const optionOrder: Record<string, number[]> = {};
  if (row.optionOrder && typeof row.optionOrder === "object" && !Array.isArray(row.optionOrder)) {
    for (const [id, value] of Object.entries(row.optionOrder as Record<string, unknown>)) {
      if (Array.isArray(value) && value.every((n) => typeof n === "number")) optionOrder[id] = value as number[];
    }
  }
  const checked: Record<string, 1> = {};
  if (row.checked && typeof row.checked === "object" && !Array.isArray(row.checked)) {
    for (const [id, value] of Object.entries(row.checked as Record<string, unknown>)) {
      if (value) checked[id] = 1;
    }
  }
  const mode: QuizMode = row.mode === "practice" || row.mode === "study" ? "practice" : "exam";
  const tag = typeof row.tag === "string" && row.tag.trim() ? row.tag.trim() : "Шалгалт";
  const key = typeof row.key === "string" && row.key.trim() ? row.key.trim() : tag;
  const updatedAt = typeof row.updatedAt === "number" ? row.updatedAt : Date.now();
  return {
    key,
    tag,
    mode,
    minutes: typeof row.minutes === "number" && Number.isFinite(row.minutes) ? Math.max(0, row.minutes) : 0,
    ids,
    answers,
    checked,
    optionOrder,
    idx: typeof row.idx === "number" ? Math.max(0, Math.floor(row.idx)) : 0,
    timeLeft: typeof row.timeLeft === "number" ? Math.max(0, Math.floor(row.timeLeft)) : 0,
    elapsed: typeof row.elapsed === "number" ? Math.max(0, Math.floor(row.elapsed)) : 0,
    updatedAt,
  };
}

export async function loadSavedExamsLocal(userId: string | null): Promise<SavedExam[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((row): row is SavedExam => row !== null).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

async function writeSavedExamsLocal(userId: string | null, exams: SavedExam[]): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(exams.slice(0, 60)));
  } catch {}
}

export async function getSavedExamLocal(userId: string | null, key: string): Promise<SavedExam | null> {
  const exams = await loadSavedExamsLocal(userId);
  return exams.find((exam) => exam.key === key) ?? null;
}

export async function saveSavedExamLocal(userId: string | null, exam: SavedExam): Promise<void> {
  const current = await loadSavedExamsLocal(userId);
  const next = [exam, ...current.filter((row) => row.key !== exam.key)].sort((a, b) => b.updatedAt - a.updatedAt);
  await writeSavedExamsLocal(userId, next);
}

export async function removeSavedExamLocal(userId: string | null, key: string): Promise<void> {
  const current = await loadSavedExamsLocal(userId);
  await writeSavedExamsLocal(userId, current.filter((row) => row.key !== key));
}

function mergeExams(local: SavedExam[], remote: SavedExam[]): SavedExam[] {
  const byKey = new Map<string, SavedExam>();
  for (const exam of [...remote, ...local]) {
    const current = byKey.get(exam.key);
    if (!current || exam.updatedAt > current.updatedAt) byKey.set(exam.key, exam);
  }
  return [...byKey.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function useSavedExams() {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const [exams, setExams] = useState<SavedExam[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const local = await loadSavedExamsLocal(userId);
    setExams(local);
    setLoading(false);
    if (!auth.token) return;
    try {
      const res = await auth.apiFetch("/api/saved-exams");
      if (!res.ok) return;
      const data = (await res.json()) as { exams?: { key?: string; data?: unknown; updatedAt?: number }[] };
      const remote = (data.exams ?? [])
        .map((row) => normalize({ ...(row.data as Record<string, unknown>), key: row.key, updatedAt: row.updatedAt }))
        .filter((row): row is SavedExam => row !== null);
      const merged = mergeExams(local, remote);
      setExams(merged);
      await writeSavedExamsLocal(userId, merged);
    } catch {}
  }, [auth.token, auth.apiFetch, userId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (exam: SavedExam) => {
      const record = { ...exam, updatedAt: Date.now() };
      await saveSavedExamLocal(userId, record);
      const current = await loadSavedExamsLocal(userId);
      setExams(current);
      if (!auth.token) return;
      void auth
        .apiFetch("/api/saved-exams", {
          method: "POST",
          body: JSON.stringify({ key: record.key, data: record }),
        })
        .catch(() => {});
    },
    [auth.token, auth.apiFetch, userId]
  );

  const remove = useCallback(
    async (key: string) => {
      await removeSavedExamLocal(userId, key);
      const current = await loadSavedExamsLocal(userId);
      setExams(current);
      if (!auth.token) return;
      void auth
        .apiFetch("/api/saved-exams", {
          method: "POST",
          body: JSON.stringify({ key, data: null }),
        })
        .catch(() => {});
    },
    [auth.token, auth.apiFetch, userId]
  );

  return useMemo(() => ({ exams, loading, refresh, save, remove }), [exams, loading, refresh, save, remove]);
}
