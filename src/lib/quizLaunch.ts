import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QuizMode } from "@/lib/types";

export type QuizLaunch = {
  ids: string[];
  answers?: Record<string, number>;
  checked?: Record<string, 1>;
  optionOrder?: Record<string, number[]>;
  mode: QuizMode;
  minutes: number;
  tag: string;
  main: string;
  sub?: string;
  source?: string;
  idx?: number;
  timeLeft?: number;
  elapsed?: number;
};

const PREFIX = "lexlab.launch.v1";
const memory = new Map<string, QuizLaunch>();

export function createLaunch(launch: QuizLaunch): string {
  const key = `launch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  memory.set(key, launch);
  AsyncStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(launch)).catch(() => {});
  return key;
}

export async function readLaunch(key: string): Promise<QuizLaunch | null> {
  const cached = memory.get(key);
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizLaunch;
    if (!parsed || !Array.isArray(parsed.ids) || parsed.ids.length === 0) return null;
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function updateLaunch(key: string, patch: Partial<QuizLaunch>): Promise<void> {
  const current = await readLaunch(key);
  if (!current) return;
  const next = { ...current, ...patch };
  memory.set(key, next);
  try {
    await AsyncStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(next));
  } catch {}
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildOptionOrder(ids: string[], questions: { id: string; options: string[] }[]): Record<string, number[]> {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const order: Record<string, number[]> = {};
  for (const id of ids) {
    const q = byId.get(id);
    if (!q) continue;
    order[id] = shuffle(q.options.map((_, i) => i));
  }
  return order;
}
