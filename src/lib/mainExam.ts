import type { BankQuestion } from "@/lib/types";
import { shuffle } from "@/lib/quizLaunch";

export const MAIN_EXAM_TOTAL = 200;

const FOCUS_ACTS = [
  "Иргэний хууль",
  "Иргэний хэрэг шүүхэд хянан шийдвэрлэх тухай хууль",
  "Эрүүгийн хууль",
  "Эрүүгийн хэрэг хянан шийдвэрлэх тухай хууль",
  "Захиргааны ерөнхий хууль",
  "Захиргааны хэрэг шүүхэд хянан шийдвэрлэх тухай хууль",
];
const TEN_ACTS = ["Хууль зүйн туслалцааны тухай хууль", "Хуульчийн ёс зүй", "Хуульчийн эрх зүйн байдлын тухай хууль"];
const FOCUS_SLOTS = 20;
const TEN_SLOTS = 20;
const SAMPLE_SLOTS = 2;

function normalizeSub(name: string): string {
  return name.replace(/^\d+\.\d+[A-Za-zА-Яа-я]?\s+/, "").trim();
}

function apportion(sizes: Map<string, number>, slots: number): Map<string, number> {
  const out = new Map<string, number>();
  const total = [...sizes.values()].reduce((sum, n) => sum + n, 0);
  if (total <= 0 || slots <= 0) {
    for (const key of sizes.keys()) out.set(key, 0);
    return out;
  }
  const raw = new Map<string, number>();
  for (const [key, n] of sizes) {
    const exact = (slots * n) / total;
    raw.set(key, exact);
    out.set(key, Math.floor(exact));
  }
  let assigned = [...out.values()].reduce((sum, n) => sum + n, 0);
  const keys = [...sizes.keys()].sort((a, b) => (raw.get(b)! - out.get(b)!) - (raw.get(a)! - out.get(a)!));
  for (const key of keys) {
    if (assigned >= slots) break;
    out.set(key, (out.get(key) ?? 0) + 1);
    assigned += 1;
  }
  return out;
}

export function pickMainExamQuestions(questions: BankQuestion[]): BankQuestion[] {
  const seen = new Set<string>();
  const picked: BankQuestion[] = [];
  const add = (q: BankQuestion) => {
    if (seen.has(q.id)) return;
    seen.add(q.id);
    picked.push(q);
  };
  const bySub = new Map<string, BankQuestion[]>();
  for (const q of questions) {
    const key = normalizeSub(q.subCategory);
    const list = bySub.get(key);
    if (list) list.push(q);
    else bySub.set(key, [q]);
  }

  const sample = questions.filter((q) => q.category.startsWith("III."));
  const isSample = (q: BankQuestion) => sample.includes(q);
  const usedNames = new Set<string>([...FOCUS_ACTS, ...TEN_ACTS]);

  for (const name of FOCUS_ACTS) {
    const pool = shuffle((bySub.get(name) ?? []).filter((q) => !isSample(q)));
    pool.slice(0, FOCUS_SLOTS).forEach(add);
  }

  const tenSizes = new Map(
    TEN_ACTS.map((name) => [name, (bySub.get(name) ?? []).filter((q) => !isSample(q)).length] as [string, number])
  );
  const tenTake = apportion(tenSizes, TEN_SLOTS);
  for (const name of TEN_ACTS) {
    const pool = shuffle((bySub.get(name) ?? []).filter((q) => !isSample(q)));
    pool.slice(0, tenTake.get(name) ?? 0).forEach(add);
  }

  shuffle(sample).slice(0, SAMPLE_SLOTS).forEach(add);

  const rest = new Map<string, BankQuestion[]>();
  for (const q of questions) {
    if (isSample(q)) continue;
    if (usedNames.has(normalizeSub(q.subCategory))) continue;
    const key = `${q.category}\u0001${q.subCategory}`;
    const list = rest.get(key);
    if (list) list.push(q);
    else rest.set(key, [q]);
  }
  const restTake = apportion(
    new Map([...rest].map(([key, list]) => [key, list.length] as [string, number])),
    Math.max(0, MAIN_EXAM_TOTAL - picked.length)
  );
  for (const [key, n] of restTake) {
    if (n <= 0) continue;
    shuffle(rest.get(key) ?? []).slice(0, n).forEach(add);
  }

  if (picked.length < MAIN_EXAM_TOTAL) {
    const fill = shuffle(questions.filter((q) => !seen.has(q.id)));
    fill.slice(0, MAIN_EXAM_TOTAL - picked.length).forEach(add);
  }

  return shuffle(picked).slice(0, MAIN_EXAM_TOTAL);
}
