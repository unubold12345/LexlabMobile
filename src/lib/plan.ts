import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

export type PlanItem = {
  id: string;
  text: string;
  main: string;
  sub: string;
  done: boolean;
  date: string;
};

const PLAN_PREFIX = "lexlab.plan.v1";

function parseItems(raw: string | null): PlanItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PlanItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.date === "string" &&
        typeof item.main === "string" &&
        typeof item.sub === "string"
    );
  } catch {
    return [];
  }
}

export function usePlan() {
  const auth = useAuth();
  const storageKey = `${PLAN_PREFIX}:${auth.user?.id ?? "guest"}`;
  const [items, setItems] = useState<PlanItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const itemsRef = useRef<PlanItem[]>([]);
  const keyRef = useRef(storageKey);
  keyRef.current = storageKey;

  const commit = useCallback((next: PlanItem[]) => {
    itemsRef.current = next;
    setItems(next);
    AsyncStorage.setItem(keyRef.current, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!auth.hydrated) return;
    let alive = true;
    setHydrated(false);
    setItems([]);
    itemsRef.current = [];

    (async () => {
      const local = parseItems(await AsyncStorage.getItem(storageKey).catch(() => null));
      if (alive && local.length > 0) {
        itemsRef.current = local;
        setItems(local);
      }
      if (alive) setHydrated(true);
      if (!auth.token) return;
      try {
        const res = await auth.apiFetch("/api/study/todos");
        if (!res.ok) return;
        const data = (await res.json()) as { todos?: PlanItem[] };
        if (alive && Array.isArray(data.todos)) {
          commit(data.todos);
        }
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, [auth.hydrated, auth.token, auth.apiFetch, storageKey, commit]);

  const add = useCallback(
    (scope: { main: string; sub: string; text?: string; date: string }) => {
      const item: PlanItem = {
        id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: scope.text?.trim() || "",
        main: scope.main,
        sub: scope.sub,
        done: false,
        date: scope.date,
      };
      commit([item, ...itemsRef.current]);
      if (auth.token) {
        void auth
          .apiFetch("/api/study/todos", {
            method: "POST",
            body: JSON.stringify(item),
          })
          .catch(() => {});
      }
      return item;
    },
    [auth.token, auth.apiFetch, commit]
  );

  const toggle = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((row) => row.id === id);
      if (!item) return;
      commit(itemsRef.current.map((row) => (row.id === id ? { ...row, done: !row.done } : row)));
      if (auth.token) {
        void auth
          .apiFetch("/api/study/todos", {
            method: "PATCH",
            body: JSON.stringify({ id, done: !item.done }),
          })
          .catch(() => {});
      }
    },
    [auth.token, auth.apiFetch, commit]
  );

  const remove = useCallback(
    (id: string) => {
      commit(itemsRef.current.filter((row) => row.id !== id));
      if (auth.token) {
        void auth
          .apiFetch(`/api/study/todos?id=${encodeURIComponent(id)}`, { method: "DELETE" })
          .catch(() => {});
      }
    },
    [auth.token, auth.apiFetch, commit]
  );

  const clearDone = useCallback(
    (date: string) => {
      commit(itemsRef.current.filter((row) => !(row.done && row.date === date)));
      if (auth.token) {
        void auth
          .apiFetch(`/api/study/todos?doneDate=${encodeURIComponent(date)}`, { method: "DELETE" })
          .catch(() => {});
      }
    },
    [auth.token, auth.apiFetch, commit]
  );

  return { items, hydrated, add, toggle, remove, clearDone, synced: !!auth.token };
}

export function planDayTitle(key: string): string {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  if (key === todayKey) return "Өнөөдөр";
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  const diff = Math.round((date.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
  if (diff === 1) return "Маргааш";
  if (diff === -1) return "Өчигдөр";
  return `${month}.${day} · ${["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"][date.getDay()]}`;
}

export function shiftPlanDay(key: string, delta: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + delta);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): string {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}
