import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Icon } from "@/components/Icon";
import { QuestionGridModal } from "@/components/QuestionGridModal";
import { QuizOption, OptionState } from "@/components/QuizOption";
import { PressableScale, ProgressBar, Tag } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useBank } from "@/lib/bank";
import { useProgress } from "@/lib/progress";
import { useResponsive } from "@/lib/responsive";
import { useSavedExams, getSavedExamLocal, type SavedExam } from "@/lib/savedExams";
import { buildOptionOrder, createLaunch, readLaunch, shuffle, updateLaunch, type QuizLaunch } from "@/lib/quizLaunch";
import { clock } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";
import type { AnswerRow, BankQuestion, QuizMode } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

type Boot = {
  questions: BankQuestion[];
  launchKey: string;
  savedKey: string;
  tag: string;
  main: string;
  sub: string;
  mode: QuizMode;
  minutes: number;
  answers: Record<string, number>;
  checked: Record<string, 1>;
  optionOrder: Record<string, number[]>;
  index: number;
  timeLeft: number;
  elapsed: number;
};

export default function Quiz() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { gutter, maxContentWidth, isTablet } = useResponsive();
  const readingMaxWidth = Math.min(maxContentWidth, 860);
  const auth = useAuth();
  const bank = useBank();
  const progress = useProgress();
  const saved = useSavedExams();
  const params = useLocalSearchParams<{
    launch?: string;
    saved?: string;
    main?: string;
    sub?: string;
    count?: string;
    mode?: string;
    source?: string;
    restart?: string;
  }>();

  const launchParam = one(params.launch);
  const savedParam = one(params.saved);
  const [boot, setBoot] = useState<Boot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bankReady, setBankReady] = useState(false);
  const [graceOver, setGraceOver] = useState(false);
  const booted = useRef(false);
  const bootTried = useRef(false);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, 1>>({});
  const [optionOrder, setOptionOrder] = useState<Record<string, number[]>>({});
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBankReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setGraceOver(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (booted.current || bootTried.current) return;
    if (!auth.hydrated || bank.questions.length === 0) return;
    if ((launchParam || savedParam) && !bankReady && !graceOver) return;
    bootTried.current = true;

    void (async () => {
      const byId = new Map(bank.questions.map((q) => [q.id, q]));
      const restart = one(params.restart) === "1";

      let ids: string[] = [];
      let launchKey = launchParam ?? "";
      let savedKey = "";
      let tag = "Шалгалт";
      let main = "Холимог";
      let sub = "";
      let mode: QuizMode = "practice";
      let minutes = 0;
      let initialAnswers: Record<string, number> = {};
      let initialChecked: Record<string, 1> = {};
      let recordOrder: Record<string, number[]> = {};
      let initialIndex = 0;
      let initialTimeLeft = 0;
      let initialElapsed = 0;

      if (savedParam) {
        const record = await getSavedExamLocal(auth.user?.id ?? null, savedParam);
        if (record) {
          ids = record.ids;
          savedKey = record.key;
          tag = record.tag;
          main = record.tag;
          mode = record.mode;
          minutes = record.minutes;
          initialAnswers = record.answers;
          initialChecked = record.checked ?? {};
          recordOrder = record.optionOrder;
          initialIndex = record.idx;
          initialTimeLeft = record.timeLeft;
          initialElapsed = record.elapsed;
        }
      } else if (launchParam) {
        const record = await readLaunch(launchParam);
        if (record) {
          ids = record.ids;
          tag = record.tag || tag;
          main = record.main || main;
          sub = record.sub ?? "";
          mode = record.mode;
          minutes = record.minutes;
          initialAnswers = restart ? {} : record.answers ?? {};
          initialChecked = restart ? {} : record.checked ?? {};
          recordOrder = record.optionOrder ?? {};
          initialIndex = restart ? 0 : record.idx ?? 0;
          initialTimeLeft = restart ? minutes * 60 : record.timeLeft ?? minutes * 60;
          initialElapsed = restart ? 0 : record.elapsed ?? 0;
          savedKey = record.tag || "";
        }
      } else {
        const mainParam = one(params.main) ?? "all";
        const subParam = one(params.sub) ?? "";
        const source = one(params.source);
        const count = clampInt(one(params.count), 10, 1, Math.max(1, bank.questions.length));
        mode = one(params.mode) === "exam" ? "exam" : "practice";

        let pool: BankQuestion[];
        if (source === "wrong") {
          pool = Object.keys(progress.wrong).map((id) => byId.get(id)).filter((q): q is BankQuestion => !!q);
          tag = "Алдсан асуултууд";
          main = tag;
        } else if (source === "bookmarked") {
          pool = progress.bookmarks.map((id) => byId.get(id)).filter((q): q is BankQuestion => !!q);
          tag = "Хадгалсан асуултууд";
          main = tag;
        } else {
          pool = bank.questions.filter(
            (q) => (mainParam === "all" || q.category === mainParam) && (!subParam || q.subCategory === subParam)
          );
          sub = subParam;
          tag = subParam
            ? `${shortName(mainParam)} / ${subParam}`
            : mainParam === "all"
              ? "Холимог"
              : shortName(mainParam);
          main = tag;
        }
        const picked = shuffle(pool).slice(0, count);
        ids = picked.map((q) => q.id);
        minutes = mode === "exam" ? ids.length : 0;
        initialTimeLeft = minutes * 60;
        recordOrder = buildOptionOrder(ids, picked);
      }

      const questions = ids.map((id) => byId.get(id)).filter((q): q is BankQuestion => !!q);
      if (questions.length === 0) {
        if ((launchParam || savedParam) && !graceOver) {
          bootTried.current = false;
          return;
        }
        setLoaded(true);
        setBoot(null);
        return;
      }
      booted.current = true;

      const order: Record<string, number[]> = { ...recordOrder };
      for (const q of questions) {
        const current = order[q.id];
        if (!current || current.length !== q.options.length) {
          order[q.id] = shuffle(q.options.map((_, i) => i));
        }
      }

      if (!launchKey) {
        launchKey = createLaunch({
          ids: questions.map((q) => q.id),
          answers: initialAnswers,
          checked: initialChecked,
          optionOrder: order,
          mode,
          minutes,
          tag,
          main,
          sub,
          source: one(params.source),
          idx: initialIndex,
          timeLeft: initialTimeLeft,
          elapsed: initialElapsed,
        });
      }

      const safeIndex = Math.min(Math.max(initialIndex, 0), questions.length - 1);
      const safeTime = minutes > 0 ? Math.max(0, initialTimeLeft || minutes * 60) : 0;

      setAnswers(initialAnswers);
      setChecked(initialChecked);
      setOptionOrder(order);
      setIndex(safeIndex);
      setElapsed(Math.max(0, initialElapsed));
      setTimeLeft(safeTime);
      setBoot({
        questions,
        launchKey,
        savedKey: savedKey || tag,
        tag,
        main,
        sub,
        mode,
        minutes,
        answers: initialAnswers,
        checked: initialChecked,
        optionOrder: order,
        index: safeIndex,
        timeLeft: safeTime,
        elapsed: Math.max(0, initialElapsed),
      });
      setLoaded(true);
    })();
  }, [
    auth.hydrated,
    auth.user?.id,
    bank.questions,
    bankReady,
    launchParam,
    savedParam,
    graceOver,
    params.main,
    params.sub,
    params.count,
    params.mode,
    params.source,
    params.restart,
    progress.bookmarks,
    progress.wrong,
  ]);

  const questions = boot?.questions ?? [];
  const current = questions[index];
  const isLast = index === questions.length - 1;
  const selected = current ? answers[current.id] : undefined;
  const isChecked = current ? !!checked[current.id] : false;
  const bookmarked = current ? progress.bookmarks.includes(current.id) : false;
  const answeredCount = Object.keys(answers).length;
  const timer = boot && boot.minutes > 0 ? timeLeft : elapsed;
  const timerDanger = !!boot && boot.minutes > 0 && timeLeft <= 60;

  const finish = useCallback(
    async (reason: "time" | "manual" = "manual") => {
      if (!boot || finishingRef.current) return;
      finishingRef.current = true;
      setFinishing(true);
      const rows: AnswerRow[] = boot.questions.map((q) => {
        const choice = answers[q.id];
        if (choice === undefined) return { id: q.id, status: "skipped" };
        return { id: q.id, choice, status: choice === q.answer ? "correct" : "wrong" };
      });
      const correct = rows.filter((row) => row.status === "correct").length;
      const wrong = rows.filter((row) => row.status === "wrong").length;
      const skipped = rows.filter((row) => row.status === "skipped").length;
      const xp = progress.recordResult({ main: boot.main, mode: boot.mode, seconds: elapsed, rows });
      await updateLaunch(boot.launchKey, {
        ids: boot.questions.map((q) => q.id),
        answers,
        checked,
        optionOrder,
        idx: index,
        timeLeft,
        elapsed,
      });
      void saved.remove(boot.savedKey);
      router.replace({
        pathname: "/result",
        params: {
          launch: boot.launchKey,
          correct: String(correct),
          wrong: String(wrong),
          skipped: String(skipped),
          total: String(rows.length),
          xp: String(xp),
          seconds: String(elapsed),
          main: boot.main,
          sub: boot.sub,
          count: String(rows.length),
          mode: boot.mode,
          source: boot.tag,
          tag: boot.tag,
          timedout: reason === "time" ? "1" : "0",
        },
      });
    },
    [answers, boot, checked, elapsed, index, optionOrder, progress, router, saved, timeLeft]
  );

  useEffect(() => {
    if (!boot || paused || finishing) return;
    const timer = setInterval(() => {
      setElapsed((value) => value + 1);
      if (boot.minutes > 0) setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [boot, finishing, paused]);

  useEffect(() => {
    if (!boot || boot.minutes <= 0 || timeLeft > 0 || finishing) return;
    void finish("time");
  }, [boot, finish, finishing, timeLeft]);

  const jump = (next: number) => {
    setIndex(Math.min(Math.max(next, 0), questions.length - 1));
    setNavOpen(false);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const advance = () => {
    if (isLast) {
      void finish();
      return;
    }
    jump(index + 1);
  };

  const check = () => {
    if (!current || selected === undefined || isChecked) return;
    setChecked((prev) => ({ ...prev, [current.id]: 1 }));
  };

  const primary = () => {
    if (!current) return;
    if (boot?.mode === "practice" && !isChecked) {
      check();
      return;
    }
    advance();
  };

  const select = (choice: number) => {
    if (!current || (boot?.mode === "practice" && isChecked)) return;
    setAnswers((prev) => ({ ...prev, [current.id]: choice }));
  };

  const hasProgress = answeredCount > 0 || index > 0 || elapsed > 5 || Object.keys(checked).length > 0;

  const leave = () => {
    setExitConfirm(false);
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const saveDraft = async () => {
    if (!boot) return;
    const record: SavedExam = {
      key: boot.savedKey,
      tag: boot.tag,
      mode: boot.mode,
      minutes: boot.minutes,
      ids: boot.questions.map((q) => q.id),
      answers,
      checked,
      optionOrder,
      idx: index,
      timeLeft,
      elapsed,
      updatedAt: Date.now(),
    };
    await saved.save(record);
    await updateLaunch(boot.launchKey, { answers, checked, optionOrder, idx: index, timeLeft, elapsed });
    setExitConfirm(false);
    leave();
  };

  const close = () => {
    if (!hasProgress) leave();
    else {
      setPaused(false);
      setExitConfirm(true);
    }
  };

  const answeredIndexes = useMemo(() => {
    const next = new Set<number>();
    questions.forEach((question, i) => {
      if (answers[question.id] !== undefined) next.add(i);
    });
    return next;
  }, [answers, questions]);

  if (!loaded) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Бэлдэж байна…</Text>
      </View>
    );
  }

  if (!boot || !current) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Icon name="book" size={24} color={colors.dim} />
        </View>
        <Text style={styles.emptyTitle}>Сорилго олдсонгүй</Text>
        <Text style={styles.emptyText}>
          {savedParam ? "Хадгалсан шалгалт олдсонгүй эсвэл аль хэдийн дууссан байна." : "Энэ шалгалтад тохирох асуулт байхгүй байна."}
        </Text>
        <PressableScale onPress={leave} scaleTo={0.97}>
          <View style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Буцах</Text>
          </View>
        </PressableScale>
      </View>
    );
  }

  const displayedOrder = optionOrder[current.id] ?? current.options.map((_, i) => i);
  const correctDisplay = displayedOrder.indexOf(current.answer);

  const optionState = (optionIndex: number): OptionState => {
    if (boot.mode === "practice" && isChecked) {
      if (optionIndex === current.answer) return "correct";
      if (selected === optionIndex) return "wrong";
      return "dimmed";
    }
    return selected === optionIndex ? "selected" : "idle";
  };

  const primaryLabel =
    boot.mode === "practice" && !isChecked
      ? "Хариу шалгах"
      : isLast
        ? "Дуусгах"
        : boot.mode === "exam" && selected === undefined
          ? "Алгасах"
          : "Дараах";

  return (
    <View style={styles.root}>
      <View style={[styles.column, { maxWidth: maxContentWidth }]}>
        <View style={[styles.top, { paddingTop: insets.top + 8, paddingHorizontal: gutter }]}>
        <PressableScale onPress={close} scaleTo={0.9} accessibilityLabel="Хаах">
          <View style={styles.topBtn}>
            <Icon name="close" size={16} color={colors.muted} />
          </View>
        </PressableScale>
        <View style={styles.counterWrap}>
          <Text style={styles.counter}>
            {index + 1} <Text style={styles.counterMuted}>/ {questions.length}</Text>
          </Text>
          <Text numberOfLines={1} style={styles.counterTag}>{boot.tag}</Text>
        </View>
        <View style={[styles.timerPill, timerDanger && styles.timerDanger]}>
          <Icon name="clock" size={12} color={timerDanger ? colors.rose : colors.muted} />
          <Text style={[styles.timerText, timerDanger && { color: colors.rose }]}>{clock(timer)}</Text>
        </View>
      </View>

      <View style={[styles.controlRow, { paddingHorizontal: gutter }]}>
        <View style={{ flex: 1 }}>
          <ProgressBar progress={(index + 1) / questions.length} height={4} />
        </View>
        <PressableScale onPress={() => setNavOpen(true)} scaleTo={0.9} accessibilityLabel="Сорилгуудын жагсаалт">
          <View style={styles.smallBtn}>
            <Icon name="grid" size={14} color={colors.muted} />
          </View>
        </PressableScale>
        <PressableScale onPress={() => setPaused(true)} scaleTo={0.9} accessibilityLabel="Түр зогсоох">
          <View style={styles.smallBtn}>
            <View style={styles.pauseIcon}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          </View>
        </PressableScale>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter, paddingBottom: insets.bottom + 152 }]}
      >
        <View style={[styles.readingColumn, { maxWidth: readingMaxWidth }]}>
        <Animated.View key={current.id} entering={FadeInDown.duration(260)}>
          <View style={styles.metaRow}>
            <Tag text={`Асуулт ${index + 1}`} />
            <Text numberOfLines={1} style={styles.category}>{current.subCategory}</Text>
            <View style={{ flex: 1 }} />
            <PressableScale onPress={() => progress.toggleBookmark(current.id)} scaleTo={0.9}>
              <View style={[styles.bookmark, bookmarked && styles.bookmarkActive]}>
                <Icon name="bookmark" size={15} color={bookmarked ? colors.lilac : colors.dim} strokeWidth={bookmarked ? 2.2 : 1.7} />
              </View>
            </PressableScale>
          </View>

          <Text style={[styles.question, isTablet && styles.questionTablet]}>{current.question}</Text>

          <View style={styles.options}>
            {displayedOrder.map((optionIndex, displayIndex) => (
              <QuizOption
                key={`${current.id}-${optionIndex}`}
                letter={LETTERS[displayIndex] ?? "?"}
                text={current.options[optionIndex] ?? ""}
                state={optionState(optionIndex)}
                disabled={boot.mode === "practice" && isChecked}
                showLetter
                onPress={() => select(optionIndex)}
              />
            ))}
          </View>

          {boot.mode === "practice" && isChecked ? (
            <View style={[styles.feedback, { borderColor: selected === current.answer ? "rgba(52,211,153,0.22)" : "rgba(251,113,133,0.22)" }]}>
              <View style={styles.feedbackHead}>
                <Icon
                  name={selected === current.answer ? "check" : "close"}
                  size={15}
                  color={selected === current.answer ? colors.emerald : colors.rose}
                  strokeWidth={2.4}
                />
                <Text style={[styles.feedbackTitle, { color: selected === current.answer ? colors.emerald : colors.rose }]}>
                  {selected === current.answer ? "Зөв!" : "Буруу"}
                </Text>
                {selected === current.answer ? <Text style={styles.xp}>+10 XP</Text> : null}
              </View>
              {selected !== current.answer ? (
                <View style={styles.correctAnswer}>
                  <Text style={styles.correctLabel}>Зөв хариулт</Text>
                  <Text style={styles.correctText}>
                    {correctDisplay >= 0 ? `${LETTERS[correctDisplay] ?? "?"}. ` : ""}
                    {current.options[current.answer]}
                  </Text>
                </View>
              ) : null}
              {current.explanation ? <Text style={styles.explanation}>{current.explanation}</Text> : null}
              {current.lawRef ? (
                <View style={styles.lawRef}>
                  <Icon name="scale" size={12} color={colors.dim} />
                  <Text style={styles.lawRefText}>{current.lawRef}</Text>
                </View>
              ) : null}
            </View>
          ) : boot.mode === "exam" ? (
            <View style={styles.examHint}>
              <Icon name="clock" size={13} color={colors.dim} />
              <Text style={styles.examHintText}>
                Хариултаа сонгоод дараах сорилго руу шилжинэ. Хариултыг шалгах боломжгүй.
              </Text>
            </View>
          ) : null}
        </Animated.View>
        </View>
      </ScrollView>

      </View>

      <LinearGradient
        colors={["rgba(8,9,11,0)", colors.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bottomFade}
        pointerEvents="none"
      />
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.bottomInner, { maxWidth: readingMaxWidth, paddingHorizontal: gutter }]}>
        <View style={styles.bottomRow}>
          <PressableScale onPress={() => jump(index - 1)} disabled={index === 0} scaleTo={0.95}>
            <View style={[styles.prevBtn, index === 0 && { opacity: 0.35 }]}>
              <Icon name="chevronLeft" size={16} color={colors.muted} />
              <Text style={styles.prevText}>Өмнөх</Text>
            </View>
          </PressableScale>
          <PressableScale
            onPress={primary}
            disabled={finishing || (boot.mode === "practice" && !isChecked && selected === undefined)}
            scaleTo={0.98}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={["#4F5763", "#30353D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.primary,
                (finishing || (boot.mode === "practice" && !isChecked && selected === undefined)) && { opacity: 0.4 },
              ]}
            >
              <Text style={styles.primaryText}>{primaryLabel}</Text>
              <Icon name={isLast ? "check" : "arrowRight"} size={15} color={colors.white} strokeWidth={2.4} />
            </LinearGradient>
          </PressableScale>
        </View>
        {boot.mode === "practice" && !isChecked ? (
          <PressableScale onPress={advance} scaleTo={0.95}>
            <Text style={styles.skipLink}>Алгасах</Text>
          </PressableScale>
        ) : null}
        </View>
      </View>

      {paused ? (
        <View style={styles.pauseOverlay}>
          <View style={[styles.pauseCard, isTablet && styles.pauseCardTablet]}>
            <View style={styles.pauseIconWrap}>
              <View style={styles.pauseIconBig}>
                <View style={styles.pauseBarBig} />
                <View style={styles.pauseBarBig} />
              </View>
            </View>
            <Text style={styles.pauseTitle}>Түр зогссон</Text>
            <Text style={styles.pauseTime}>{boot.minutes > 0 ? clock(timeLeft) : clock(elapsed)}</Text>
            <Text style={styles.pauseHint}>Хугацаа зогссон. Үргэлжлүүлэхэд бэлэн болсон үедээ дарна уу.</Text>
            <PressableScale onPress={() => setPaused(false)} scaleTo={0.98}>
              <LinearGradient colors={["#4F5763", "#30353D"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pauseBtn}>
                <Icon name="play" size={15} color={colors.white} strokeWidth={2.4} />
                <Text style={styles.pauseBtnText}>Үргэлжлүүлэх</Text>
              </LinearGradient>
            </PressableScale>
          </View>
        </View>
      ) : null}

      <QuestionGridModal
        visible={navOpen}
        onClose={() => setNavOpen(false)}
        title="Сорилгууд"
        meta={`✓ ${answeredIndexes.size} / ${questions.length} хариулсан`}
        metaAccent={answeredIndexes.size > 0}
        total={questions.length}
        currentIndex={index}
        answeredIndexes={answeredIndexes}
        onSelect={(next) => jump(next)}
      />

      <Modal visible={exitConfirm} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setExitConfirm(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setExitConfirm(false)} accessibilityLabel="Хаах" />
          <View style={[styles.exitCard, isTablet && styles.exitCardTablet]}>
            <Text style={styles.exitTitle}>Шалгалтыг түр зогсоох уу?</Text>
            <Text style={styles.exitText}>Хариултууд хадгалагдаж, явсан газраасаа үргэлжлүүлнэ.</Text>
            <PressableScale onPress={() => setExitConfirm(false)} scaleTo={0.98}>
              <View style={styles.exitGhost}>
                <Text style={styles.exitGhostText}>Үргэлжлүүлэх</Text>
              </View>
            </PressableScale>
            <PressableScale onPress={() => void saveDraft()} scaleTo={0.98}>
              <LinearGradient colors={["#4F5763", "#30353D"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.exitPrimary}>
                <Icon name="bookmark" size={14} color={colors.white} />
                <Text style={styles.exitPrimaryText}>Хадгалах</Text>
              </LinearGradient>
            </PressableScale>
            <PressableScale onPress={leave} scaleTo={0.98}>
              <View style={styles.exitDanger}>
                <Text style={styles.exitDangerText}>Хадгалахгүй гарах</Text>
              </View>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: "100%", alignSelf: "center" },
  readingColumn: { width: "100%", alignSelf: "center" },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 30 },
  loadingText: { fontFamily: fonts.body, fontSize: 12, color: colors.dim },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text, marginTop: 16 },
  emptyText: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17, color: colors.dim, marginTop: 7, textAlign: "center" },
  emptyBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  emptyBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  top: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 10 },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  counterWrap: { flex: 1, minWidth: 0 },
  counter: { fontFamily: fonts.display, fontSize: 15, color: colors.text },
  counterMuted: { fontFamily: fonts.body, fontSize: 11, color: colors.dim },
  counterTag: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, marginTop: 2 },
  timerPill: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  timerDanger: { borderColor: "rgba(251,113,133,0.28)", backgroundColor: "rgba(251,113,133,0.08)" },
  timerText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted, fontVariant: ["tabular-nums"] },
  controlRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginTop: 2 },
  smallBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  pauseIcon: { flexDirection: "row", gap: 3 },
  pauseBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: colors.muted },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  category: { flexShrink: 1, fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, maxWidth: "46%" },
  bookmark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  bookmarkActive: { borderColor: "rgba(205,210,218,0.32)", backgroundColor: "rgba(255,255,255,0.09)" },
  question: {
    fontFamily: fonts.displayMedium,
    fontSize: 19,
    lineHeight: 28,
    color: colors.text,
    marginTop: 18,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  questionTablet: { fontSize: 21, lineHeight: 31 },
  options: { gap: 10 },
  feedback: { marginTop: 16, padding: 14, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.035)" },
  feedbackHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  feedbackTitle: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  xp: { marginLeft: "auto", fontFamily: fonts.bodySemi, fontSize: 10, color: colors.emerald },
  correctAnswer: { marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  correctLabel: { fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 1.2, color: colors.dim, textTransform: "uppercase" },
  correctText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, lineHeight: 17, color: colors.text, marginTop: 4 },
  explanation: { fontFamily: fonts.body, fontSize: 11, lineHeight: 18, color: colors.muted, marginTop: 10 },
  lawRef: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  lawRefText: { flex: 1, fontFamily: fonts.body, fontSize: 9.5, lineHeight: 14, color: colors.dim },
  examHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  examHintText: { flex: 1, fontFamily: fonts.body, fontSize: 9.5, lineHeight: 14, color: colors.dim },
  bottomFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 130 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", paddingTop: 8 },
  bottomInner: { width: "100%", alignSelf: "center" },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  prevBtn: {
    height: 52,
    paddingHorizontal: 13,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(8,9,11,0.85)",
  },
  prevText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted },
  primary: {
    height: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.white },
  skipLink: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.dim, textAlign: "center", marginTop: 9 },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(8,9,11,0.96)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 20,
  },
  pauseCard: { width: "100%", maxWidth: 340, alignItems: "center" },
  pauseCardTablet: { maxWidth: 400 },
  pauseIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pauseIconBig: { flexDirection: "row", gap: 5 },
  pauseBarBig: { width: 5, height: 22, borderRadius: 3, backgroundColor: colors.lilac },
  pauseTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.text, marginTop: 18 },
  pauseTime: { fontFamily: fonts.display, fontSize: 28, color: colors.lilac, marginTop: 8, fontVariant: ["tabular-nums"] },
  pauseHint: { fontFamily: fonts.body, fontSize: 10, lineHeight: 16, color: colors.dim, textAlign: "center", marginTop: 8 },
  pauseBtn: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 30,
  },
  pauseBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3,3,8,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  exitCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#101018",
    padding: 20,
  },
  exitCardTablet: { maxWidth: 420, padding: 24 },
  exitTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
  exitText: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 16, color: colors.dim, marginTop: 6, marginBottom: 14 },
  exitGhost: {
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  exitGhostText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.muted },
  exitPrimary: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 8,
  },
  exitPrimaryText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  exitDanger: { height: 42, alignItems: "center", justifyContent: "center", marginTop: 4 },
  exitDangerText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.rose },
});
