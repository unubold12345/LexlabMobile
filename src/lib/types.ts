export type BankQuestion = {
  id: string;
  category: string;
  subCategory: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  lawRef?: string;
  difficulty?: string;
};

export type MainGroup = {
  name: string;
  total: number;
  subs: { name: string; count: number }[];
};

export type QuizMode = "practice" | "exam";

export type AnswerRow = { id: string; status: "correct" | "wrong" | "skipped"; choice?: number };

export type HistoryItem = {
  id: string;
  main: string;
  mode: QuizMode;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  xp: number;
  seconds: number;
  at: number;
};
