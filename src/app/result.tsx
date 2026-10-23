import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { ProgressRing } from "@/components/ProgressRing";
import { GlassCard, PressableScale, ProgressBar, Reveal, SectionHeader } from "@/components/ui";
import { useBank } from "@/lib/bank";
import { useProgress } from "@/lib/progress";
import { readLaunch, type QuizLaunch } from "@/lib/quizLaunch";
import { clock } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";
import type { BankQuestion, QuizMode } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined): number {
  const n = Number.parseInt(one(value) ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

type ReviewStatus = "correct" | "wrong" | "skipped";
type ReviewItem = { question: BankQuestion; index: number; status: ReviewStatus };

export default function Result() {
  const router = useRouter();
  const bank = useBank();
  const progress = useProgress();
  const params = useLocalSearchParams<{
    launch?: string;
    correct?: string;
    wrong?: string;
    skipped?: string;
    total?: string;
    xp?: string;
    seconds?: string;
    main?: string;
    sub?: string;
    count?: string;
    mode?: string;
    source?: string;
    tag?: string;
    timedout?: string;
  }>();

  const launchKey = one(params.launch);
  const correct = numberParam(params.correct);
  const wrong = numberParam(params.wrong);
  const skipped = numberParam(params.skipped);
  const total = numberParam(params.total);
  const xp = numberParam(params.xp);
  const seconds = numberParam(params.seconds);
  const mode: QuizMode = one(params.mode) === "exam" ? "exam" : "practice";
  const tag = one(params.tag) ?? one(params.source) ?? one(params.main) ?? "Шалгалт";
  const timedout = one(params.timedout) === "1";
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const pass = pct >= 60;

  const [launch, setLaunch] = useState<QuizLaunch | null>(null);
  const [filter, setFilter] = useState<"all" | "correct" | "wrong">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [marked, setMarked] = useState<Record<string, 1>>({});

  useEffect(() => {
    if (!launchKey) return;
    let alive = true;
    readLaunch(launchKey).then((record) => {
      if (alive) setLaunch(record);
    });
    return () => {
      alive = false;
    };
  }, [launchKey]);

  useEffect(() => {
    if (wrong + skipped > 0) setFilter("wrong");
  }, [launchKey, skipped, wrong]);

  const questionById = useMemo(() => new Map(bank.questions.map((q) => [q.id, q])), [bank.questions]);

  const review = useMemo<ReviewItem[]>(() => {
    if (!launch) return [];
    return launch.ids
      .map((id, index) => {
        const question = questionById.get(id);
        if (!question) return null;
        const answer = launch.answers?.[id];
        const status: ReviewStatus = answer === undefined ? "skipped" : answer === question.answer ? "correct" : "wrong";
        return { question, index, status };
      })
      .filter((item): item is ReviewItem => item !== null);
  }, [launch, questionById]);

  const filtered = useMemo(() => {
    if (filter === "all") return review;
    if (filter === "correct") return review.filter((item) => item.status === "correct");
    return review.filter((item) => item.status !== "correct");
  }, [filter, review]);

  const visible = showAll ? filtered : filtered.slice(0, 15);

  const breakdown = useMemo(() => {
    const map = new Map<string, { ok: number; total: number }>();
    for (const item of review) {
      const row = map.get(item.question.category) ?? { ok: 0, total: 0 };
      row.total += 1;
      if (item.status === "correct") row.ok += 1;
      map.set(item.question.category, row);
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [review]);

  const restart = () => {
    if (launchKey) {
      router.push({ pathname: "/quiz", params: { launch: launchKey, restart: "1" } });
      return;
    }
    router.push({
      pathname: "/quiz",
      params: {
        main: one(params.main) ?? "all",
        sub: one(params.sub) ?? "",
        count: one(params.count) ?? "10",
        mode,
        source: one(params.source) ?? "",
      },
    });
  };

  return (
    <Screen>
      <PageHeader />

      <Reveal delay={40}>
        <GlassCard style={styles.summary}>
          <View style={styles.ringWrap}>
            <ProgressRing
              size={172}
              stroke={11}
              progress={Math.max(0, Math.min(100, pct)) / 100}
              from={pass ? colors.emerald : colors.rose}
              to={pass ? "#A7F3D0" : "#FDA4AF"}
            >
              <Text style={styles.ringPct}>{pct}%</Text>
              <Text style={styles.ringCount}>{correct} / {total}</Text>
            </ProgressRing>
          </View>

          <View style={styles.badges}>
            {mode === "exam" ? (
              <View style={[styles.badge, pass ? styles.badgePass : styles.badgeFail]}>
                <Text style={[styles.badgeText, { color: pass ? colors.emerald : colors.rose }]}>
                  {pass ? "Тэнцсэн" : "Унасан"}
                </Text>
              </View>
            ) : (
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { color: colors.lilac }]}>Сургалт</Text>
              </View>
            )}
            {timedout ? (
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { color: colors.rose }]}>Хугацаа дууссан</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.message}>
            {pct >= 90
              ? "Маш сайн! Мэдлэг чинь бэхжсэн байна."
              : pct >= 70
                ? "Сайн байна. Дахин давтаж өөрийгөө улам бэхжүүлээрэй."
                : pct >= 60
                  ? "Тэнцлээ. Алдааныхаа тайлбарыг уншиж бэхжүүлээрэй."
                  : "Алдаануудаасаа суралцаж, дахин оролдоорой."}
          </Text>
        </GlassCard>
      </Reveal>

      <Reveal delay={90}>
        <View style={styles.statsRow}>
          <StatCard value={String(correct)} label="Зөв" color={colors.emerald} />
          <StatCard value={String(wrong)} label="Буруу" color={colors.rose} />
          <StatCard value={String(skipped)} label="Алгассан" color={colors.lilac} />
          <StatCard value={clock(seconds)} label="Хугацаа" color={colors.muted} />
        </View>
      </Reveal>

      <Reveal delay={130}>
        <GlassCard style={styles.xpCard}>
          <View style={styles.xpIcon}>
            <Icon name="bolt" size={17} color={colors.lilac} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.xpValue}>+{xp} XP</Text>
            <Text style={styles.xpLabel}>Энэ шалгалтаар цуглуулсан туршлага</Text>
          </View>
          <Icon name="trending" size={18} color={colors.dim} />
        </GlassCard>
      </Reveal>

      {breakdown.length > 1 ? (
        <>
          <SectionHeader title="Ангиллын задаргаа" caption="Хариултын зөв хувь" />
          <GlassCard style={styles.breakdown}>
            {breakdown.map(([name, row]) => {
              const value = row.total > 0 ? Math.round((row.ok / row.total) * 100) : 0;
              return (
                <View key={name} style={styles.breakdownRow}>
                  <View style={styles.breakdownHead}>
                    <Text numberOfLines={1} style={styles.breakdownName}>{name}</Text>
                    <Text style={styles.breakdownValue}>{row.ok}/{row.total} · {value}%</Text>
                  </View>
                  <ProgressBar progress={value / 100} height={4} from={value >= 60 ? colors.emerald : colors.rose} to={value >= 60 ? colors.emerald : colors.rose} />
                </View>
              );
            })}
          </GlassCard>
        </>
      ) : null}

      {review.length > 0 ? (
        <>
          <SectionHeader title="Хариултын хяналт" caption={`${review.length} сорилго`} />
          <View style={styles.filters}>
            <FilterChip label={`Бүгд · ${review.length}`} active={filter === "all"} onPress={() => setFilter("all")} />
            <FilterChip label={`Зөв · ${correct}`} active={filter === "correct"} onPress={() => setFilter("correct")} />
            <FilterChip label={`Алдаа · ${wrong + skipped}`} active={filter === "wrong"} onPress={() => setFilter("wrong")} />
          </View>

          <View style={styles.reviewList}>
            {visible.map((item) => {
              const isOpen = !!expanded[item.question.id];
              const answer = launch?.answers?.[item.question.id];
              return (
                <GlassCard key={item.question.id} style={styles.reviewCard}>
                  <PressableScale
                    onPress={() => setExpanded((prev) => ({ ...prev, [item.question.id]: !isOpen }))}
                    scaleTo={0.99}
                  >
                    <View style={styles.reviewHead}>
                      <View style={[styles.statusDot, statusStyle(item.status)]}>
                        <Text style={styles.statusText}>
                          {item.status === "correct" ? "✓" : item.status === "wrong" ? "✗" : "○"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewIndex}>Асуулт {item.index + 1}</Text>
                        <Text numberOfLines={isOpen ? undefined : 2} style={styles.reviewQuestion}>
                          {item.question.question}
                        </Text>
                      </View>
                      <View style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}>
                        <Icon name="chevronRight" size={15} color={colors.dim} />
                      </View>
                    </View>
                  </PressableScale>

                  {isOpen ? (
                    <View style={styles.reviewBody}>
                      {(launch?.optionOrder?.[item.question.id] ?? item.question.options.map((_, optionIndex) => optionIndex)).map(
                        (optionIndex, displayIndex) => {
                          const text = item.question.options[optionIndex] ?? "";
                          const isCorrect = optionIndex === item.question.answer;
                          const isSelected = answer === optionIndex;
                          return (
                            <View
                              key={`${item.question.id}-${optionIndex}`}
                              style={[
                                styles.reviewOption,
                                isCorrect && styles.reviewOptionCorrect,
                                isSelected && !isCorrect && styles.reviewOptionWrong,
                              ]}
                            >
                              <Text style={[styles.reviewLetter, isCorrect && { color: colors.emerald }, isSelected && !isCorrect && { color: colors.rose }]}>
                                {LETTERS[displayIndex] ?? "?"}
                              </Text>
                              <Text style={styles.reviewOptionText}>{text}</Text>
                            </View>
                          );
                        }
                      )}
                      {item.question.explanation ? (
                        <Text style={styles.reviewExplanation}>{item.question.explanation}</Text>
                      ) : null}
                      {item.question.lawRef ? (
                        <View style={styles.reviewLaw}>
                          <Icon name="scale" size={12} color={colors.dim} />
                          <Text style={styles.reviewLawText}>{item.question.lawRef}</Text>
                        </View>
                      ) : null}
                      {item.status !== "correct" ? (
                        <PressableScale
                          onPress={() => {
                            if (marked[item.question.id]) return;
                            progress.markWrong(item.question.id);
                            setMarked((prev) => ({ ...prev, [item.question.id]: 1 }));
                          }}
                          scaleTo={0.96}
                        >
                          <View style={[styles.markBtn, marked[item.question.id] && styles.markedBtn]}>
                            <Icon
                              name={marked[item.question.id] ? "check" : "plus"}
                              size={12}
                              color={marked[item.question.id] ? colors.emerald : colors.rose}
                            />
                            <Text style={[styles.markText, marked[item.question.id] && { color: colors.emerald }]}>
                              {marked[item.question.id] ? "Их алддагт нэмэгдсэн" : "Их алддагт нэмэх"}
                            </Text>
                          </View>
                        </PressableScale>
                      ) : null}
                    </View>
                  ) : null}
                </GlassCard>
              );
            })}
          </View>

          {filtered.length > 15 && !showAll ? (
            <PressableScale onPress={() => setShowAll(true)} scaleTo={0.97}>
              <View style={styles.showAll}>
                <Text style={styles.showAllText}>Бүх {filtered.length} сорилгыг харах</Text>
                <Icon name="chevronRight" size={14} color={colors.muted} />
              </View>
            </PressableScale>
          ) : null}
        </>
      ) : null}

      <Reveal delay={180}>
        <View style={styles.actions}>
          <PressableScale onPress={restart} scaleTo={0.98} style={{ flex: 1 }}>
            <View style={styles.restartBtn}>
              <Icon name="refresh" size={15} color={colors.text} />
              <Text style={styles.restartText}>Дахин</Text>
            </View>
          </PressableScale>
          <PressableScale onPress={() => router.replace("/")} scaleTo={0.98} style={{ flex: 1 }}>
            <View style={styles.homeBtn}>
              <Icon name="home" size={15} color={colors.white} />
              <Text style={styles.homeText}>Нүүр</Text>
            </View>
          </PressableScale>
        </View>
        <PressableScale onPress={() => router.push("/exam-setup")} scaleTo={0.97}>
          <View style={styles.setupLink}>
            <Icon name="settings" size={13} color={colors.dim} />
            <Text style={styles.setupText}>Шалгалтын тохиргоо руу буцах</Text>
          </View>
        </PressableScale>
      </Reveal>

      <View style={styles.footer}>
        <Icon name="bookmark" size={12} color={colors.dim} />
        <Text style={styles.footerText}>Асуултыг хадгалах бол сорилгын дээд баруун буланд дарна уу.</Text>
      </View>
    </Screen>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.95}>
      <View style={[styles.filterChip, active && styles.filterActive]}>
        <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

function statusStyle(status: ReviewStatus) {
  if (status === "correct") return { backgroundColor: "rgba(52,211,153,0.18)", borderColor: "rgba(52,211,153,0.36)" };
  if (status === "wrong") return { backgroundColor: "rgba(251,113,133,0.16)", borderColor: "rgba(251,113,133,0.34)" };
  return { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" };
}

const styles = StyleSheet.create({
  summary: { marginTop: 18, padding: 20, alignItems: "center" },
  ringWrap: { alignItems: "center", justifyContent: "center" },
  ringPct: { fontFamily: fonts.display, fontSize: 32, color: colors.text, letterSpacing: -1 },
  ringCount: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 4 },
  badges: { flexDirection: "row", gap: 6, marginTop: 14 },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  badgePass: { borderColor: "rgba(52,211,153,0.28)", backgroundColor: "rgba(52,211,153,0.08)" },
  badgeFail: { borderColor: "rgba(251,113,133,0.28)", backgroundColor: "rgba(251,113,133,0.08)" },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 0.4, textTransform: "uppercase" },
  message: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17, color: colors.muted, textAlign: "center", marginTop: 12, maxWidth: 280 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  statCard: {
    flex: 1,
    minHeight: 62,
    borderRadius: 14,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statValue: { fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.4 },
  statLabel: { fontFamily: fonts.body, fontSize: 8.5, color: colors.dim, marginTop: 3 },
  xpCard: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 12, padding: 14 },
  xpIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  xpValue: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
  xpLabel: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, marginTop: 2 },
  breakdown: { padding: 14, gap: 11 },
  breakdownRow: { gap: 5 },
  breakdownHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownName: { flex: 1, fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  breakdownValue: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.dim },
  filters: { flexDirection: "row", gap: 6, marginBottom: 10 },
  filterChip: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  filterActive: { borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(255,255,255,0.09)" },
  filterText: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.dim },
  filterTextActive: { color: colors.text },
  reviewList: { gap: 9 },
  reviewCard: { padding: 13 },
  reviewHead: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  statusDot: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.text },
  reviewIndex: { fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 0.8, color: colors.dim, textTransform: "uppercase" },
  reviewQuestion: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 17, color: colors.text, marginTop: 3 },
  reviewBody: { marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", gap: 6 },
  reviewOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  reviewOptionCorrect: { borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.08)" },
  reviewOptionWrong: { borderColor: "rgba(251,113,133,0.3)", backgroundColor: "rgba(251,113,133,0.07)" },
  reviewLetter: { width: 14, fontFamily: fonts.bodyBold, fontSize: 10, color: colors.dim },
  reviewOptionText: { flex: 1, fontFamily: fonts.body, fontSize: 10, lineHeight: 15, color: colors.muted },
  reviewExplanation: { fontFamily: fonts.body, fontSize: 10, lineHeight: 16, color: colors.muted, marginTop: 5 },
  reviewLaw: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 7 },
  reviewLawText: { flex: 1, fontFamily: fonts.body, fontSize: 8.5, color: colors.dim },
  markBtn: {
    alignSelf: "flex-start",
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.24)",
    backgroundColor: "rgba(251,113,133,0.06)",
  },
  markedBtn: { borderColor: "rgba(52,211,153,0.24)", backgroundColor: "rgba(52,211,153,0.06)" },
  markText: { fontFamily: fonts.bodySemi, fontSize: 8.5, color: colors.rose },
  showAll: {
    height: 42,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  showAllText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted },
  actions: { flexDirection: "row", gap: 9, marginTop: 22 },
  restartBtn: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  restartText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  homeBtn: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#4F5763",
  },
  homeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  setupLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
  setupText: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, opacity: 0.7 },
  footerText: { flex: 1, fontFamily: fonts.body, fontSize: 9, color: colors.dim },
});
