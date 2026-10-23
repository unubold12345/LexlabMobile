import type { QuizMode } from "@/lib/types";

export function dayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function relativeDay(at: number): string {
  const now = new Date();
  const then = new Date(at);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.floor((startOfToday - new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime()) / 86400000);
  const hm = `${String(then.getHours()).padStart(2, "0")}:${String(then.getMinutes()).padStart(2, "0")}`;
  if (diff <= 0) return `Өнөөдөр ${hm}`;
  if (diff === 1) return `Өчигдөр ${hm}`;
  return `${diff} хоногийн өмнө`;
}

export function computeXp(correct: number, total: number, mode: QuizMode): number {
  const base = correct * 10;
  const perfect = total > 0 && correct === total ? 25 : 0;
  const raw = base + perfect;
  return Math.round(mode === "exam" ? raw * 1.5 : raw);
}

export const WEEKDAYS_MN = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"] as const;

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Шөнийн ажил уу";
  if (h < 12) return "Өглөөний мэнд";
  if (h < 18) return "Өдрийн мэнд";
  return "Оройн мэнд";
}

export function levelOf(xp: number): { level: number; into: number; span: number } {
  const span = 500;
  const level = Math.floor(xp / span) + 1;
  return { level, into: xp % span, span };
}

export function accuracy(correct: number, solved: number): number {
  if (solved <= 0) return 0;
  return Math.round((correct / solved) * 100);
}
