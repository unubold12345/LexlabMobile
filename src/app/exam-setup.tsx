import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { SubjectPickerSheet } from "@/components/SubjectPickerSheet";
import { GlassCard, PressableScale, Reveal, SectionHeader } from "@/components/ui";
import { useBank } from "@/lib/bank";
import { useProgress } from "@/lib/progress";
import { createLaunch, shuffle } from "@/lib/quizLaunch";
import { pickMainExamQuestions } from "@/lib/mainExam";
import { relativeDay } from "@/lib/format";
import { classifyQType } from "@/lib/qtype";
import { colors, fonts, radii } from "@/lib/theme";
import type { BankQuestion, QuizMode } from "@/lib/types";

type QType = "all" | "case" | "knowledge";
type Picker = "setup" | "subExam" | null;

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

function subLabel(main: string, sub: string): string {
  return `${shortName(main)} / ${sub}`;
}

export default function ExamSetup() {
  const router = useRouter();
  const bank = useBank();
  const progress = useProgress();

  const [main, setMain] = useState("all");
  const [sub, setSub] = useState("");
  const [qtype, setQtype] = useState<QType>("all");
  const [count, setCount] = useState(20);
  const [customCount, setCustomCount] = useState("");
  const [mode, setMode] = useState<QuizMode>("exam");
  const [picker, setPicker] = useState<Picker>(null);
  const [subPick, setSubPick] = useState<{ main: string; sub: string; count: number } | null>(null);

  const pool = useMemo<BankQuestion[]>(() => {
    const rows = bank.questions.filter((q) => (main === "all" || q.category === main) && (!sub || q.subCategory === sub));
    if (qtype === "all") return rows;
    return rows.filter((q) => classifyQType(q.question) === qtype);
  }, [bank.questions, main, sub, qtype]);

  const available = Math.min(Math.max(1, count), pool.length);
  const label = sub ? subLabel(main, sub) : main === "all" ? "Бүх сэдэв" : shortName(main);

  const countPresets = useMemo(
    () => Array.from(new Set([10, 20, 30, 50, pool.length])).filter((n) => n > 0).sort((a, b) => a - b),
    [pool.length]
  );

  const subPairs = useMemo(() => {
    const rows: { main: string; sub: string; count: number }[] = [];
    for (const group of bank.mains) {
      for (const item of group.subs) {
        if (item.count > 0) rows.push({ main: group.name, sub: item.name, count: item.count });
      }
    }
    return rows;
  }, [bank.mains]);

  const subHistory = useMemo(() => {
    if (!subPick) return [];
    const labelKey = subLabel(subPick.main, subPick.sub);
    return progress.history.filter((h) => h.main === labelKey);
  }, [progress.history, subPick]);

  const subStats = useMemo(() => {
    if (subHistory.length === 0) return null;
    let best = subHistory[0];
    let sum = 0;
    for (const item of subHistory) {
      sum += item.correct / Math.max(1, item.total);
      if (item.correct / Math.max(1, item.total) > best.correct / Math.max(1, best.total)) best = item;
    }
    return {
      n: subHistory.length,
      best,
      avg: Math.round((sum / subHistory.length) * 100),
      last: subHistory[0],
    };
  }, [subHistory]);

  const mainStats = useMemo(() => {
    const rows = progress.history.filter((h) => h.main === "Үндсэн шалгалт");
    if (rows.length === 0) return null;
    let best = rows[0];
    let sum = 0;
    for (const item of rows) {
      sum += item.correct / Math.max(1, item.total);
      if (item.correct / Math.max(1, item.total) > best.correct / Math.max(1, best.total)) best = item;
    }
    return { n: rows.length, best, avg: Math.round((sum / rows.length) * 100), last: rows[0] };
  }, [progress.history]);

  const lastExams = useMemo(() => progress.history.filter((h) => h.mode === "exam").slice(0, 5), [progress.history]);

  const start = () => {
    if (pool.length === 0) return;
    const picked = shuffle(pool).slice(0, available);
    if (picked.length === 0) return;
    const key = createLaunch({
      ids: picked.map((q) => q.id),
      mode,
      minutes: mode === "exam" ? picked.length : 0,
      tag: label,
      main: label,
      sub,
      source: "setup",
    });
    router.push({ pathname: "/quiz", params: { launch: key } });
  };

  const startMainExam = () => {
    const picked = pickMainExamQuestions(bank.questions);
    if (picked.length === 0) return;
    const key = createLaunch({
      ids: picked.map((q) => q.id),
      mode: "exam",
      minutes: picked.length,
      tag: "Үндсэн шалгалт",
      main: "Үндсэн шалгалт",
      source: "main",
    });
    router.push({ pathname: "/quiz", params: { launch: key } });
  };

  const startSubExam = () => {
    if (!subPick) return;
    const rows = bank.questions.filter((q) => q.category === subPick.main && q.subCategory === subPick.sub);
    if (rows.length === 0) return;
    const labelKey = subLabel(subPick.main, subPick.sub);
    const key = createLaunch({
      ids: shuffle(rows).map((q) => q.id),
      mode: "exam",
      minutes: rows.length,
      tag: labelKey,
      main: labelKey,
      sub: subPick.sub,
      source: "sub",
    });
    router.push({ pathname: "/quiz", params: { launch: key } });
  };

  return (
    <Screen>
      <PageHeader backTo="/practice" />

      <Reveal delay={60}>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.cardHead}>
            <View style={styles.headIcon}>
              <Icon name="settings" size={17} color={colors.lilac} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Шалгалт тохиргоо</Text>
              <Text style={styles.cardCaption}>Ангилал, төрөл, сорилгын тоогоо сонгоно</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pool.length}</Text>
            </View>
          </View>

          <Text style={styles.label}>ҮНДСЭН АНГИЛАЛ</Text>
          <PressableScale onPress={() => setPicker("setup")} scaleTo={0.985}>
            <View style={styles.selectRow}>
              <View style={styles.selectIcon}>
                <Icon name="book" size={15} color={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.selectValue}>
                  {main === "all" ? "Бүх үндсэн" : shortName(main)}
                </Text>
                <Text numberOfLines={1} style={styles.selectMeta}>
                  {sub ? sub : "Бүх дэд ангилал"} · {pool.length} асуулт
                </Text>
              </View>
              <Icon name="chevronRight" size={15} color={colors.dim} />
            </View>
          </PressableScale>

          <Text style={styles.label}>ТӨРӨЛ</Text>
          <View style={styles.row}>
            {([
              { value: "all", label: "Бүгд" },
              { value: "case", label: "Кейс" },
              { value: "knowledge", label: "Онол" },
            ] as { value: QType; label: string }[]).map((option) => (
              <PressableScale key={option.value} onPress={() => setQtype(option.value)} scaleTo={0.97} style={{ flex: 1 }}>
                <View style={[styles.typeBtn, qtype === option.value && styles.typeActive]}>
                  <Text style={[styles.typeText, qtype === option.value && styles.typeTextActive]}>{option.label}</Text>
                </View>
              </PressableScale>
            ))}
          </View>

          <Text style={styles.label}>СОРИЛГЫН ТОО</Text>
          <View style={styles.countWrap}>
            {countPresets.map((n) => {
              const active = customCount === "" && count === n;
              return (
                <PressableScale key={n} onPress={() => { setCount(n); setCustomCount(""); }} scaleTo={0.95}>
                  <View style={[styles.countChip, active && styles.countChipActive]}>
                    <Text style={[styles.countText, active && styles.countTextActive]}>
                      {n === pool.length ? `Бүгд (${n})` : n}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.customRow}>
            <Text style={styles.customLabel}>Дурын тоо</Text>
            <TextInput
              value={customCount}
              onChangeText={(raw) => {
                const clean = raw.replace(/[^0-9]/g, "");
                setCustomCount(clean);
                if (clean === "") return;
                const value = Math.floor(Number(clean));
                if (Number.isFinite(value)) setCount(Math.min(Math.max(value, 1), Math.max(pool.length, 1)));
              }}
              keyboardType="numeric"
              placeholder={`1–${Math.max(1, pool.length)}`}
              placeholderTextColor={colors.dim}
              selectionColor={colors.lilac}
              style={styles.customInput}
            />
            {customCount !== "" ? <Text style={styles.customChosen}>{available} сонгосон</Text> : null}
          </View>

          <Text style={styles.label}>ГОРИМ</Text>
          <View style={styles.row}>
            {([
              { value: "exam" as QuizMode, label: "Шалгалт", caption: "Хугацаатай" },
              { value: "practice" as QuizMode, label: "Сургалт", caption: "Шууд шалгана" },
            ]).map((option) => (
              <PressableScale key={option.value} onPress={() => setMode(option.value)} scaleTo={0.97} style={{ flex: 1 }}>
                <View style={[styles.modeBtn, mode === option.value && styles.modeActive]}>
                  <Icon
                    name={option.value === "exam" ? "clock" : "book"}
                    size={15}
                    color={mode === option.value ? colors.white : colors.dim}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeTitle, mode === option.value && styles.modeTitleActive]}>{option.label}</Text>
                    <Text style={styles.modeCaption}>{option.caption}</Text>
                  </View>
                </View>
              </PressableScale>
            ))}
          </View>

          <View style={styles.statsRow}>
            <MiniStat value={String(pool.length)} label="Сан" />
            <MiniStat value={String(available)} label="Сонгосон" />
            <MiniStat value={mode === "exam" ? `${available} мин` : "∞"} label="Хугацаа" />
          </View>
          <Text style={styles.hint}>
            {mode === "exam" ? "1 минут / сорилго · хугацаа дуусахад автоматаар дуусна" : "Сорилго бүрдээ хариултаа шалгах боломжтой"}
          </Text>

          <PressableScale onPress={start} disabled={pool.length === 0} scaleTo={0.98}>
            <LinearGradient colors={["#4F5763", "#30353D"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primary, pool.length === 0 && { opacity: 0.4 }]}>
              <Icon name="play" size={16} color={colors.white} strokeWidth={2.4} />
              <Text style={styles.primaryText}>Эхлэх — {available} сорилго</Text>
              <Icon name="arrowRight" size={16} color={colors.white} />
            </LinearGradient>
          </PressableScale>
        </GlassCard>
      </Reveal>

      <SectionHeader title="Дэд ангиллаар шалгалт" caption="Нэг дэд ангиллын бүх сорилгоор бэлдэнэ" />
      <Reveal delay={140}>
        <GlassCard style={styles.sectionCard}>
          <PressableScale onPress={() => setPicker("subExam")} scaleTo={0.985}>
            <View style={styles.selectRow}>
              <View style={styles.selectIcon}>
                <Icon name="layers" size={15} color={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.selectValue}>
                  {subPick ? subPick.sub : "Дэд ангилал сонгох"}
                </Text>
                <Text numberOfLines={1} style={styles.selectMeta}>
                  {subPick ? `${shortName(subPick.main)} · ${subPick.count} асуулт` : `${subPairs.length} дэд ангилал`}
                </Text>
              </View>
              <Icon name="chevronRight" size={15} color={colors.dim} />
            </View>
          </PressableScale>

          {subPick ? (
            <>
              {subStats ? (
                <View style={styles.statsRow}>
                  <MiniStat value={String(subStats.n)} label="Оролдлого" />
                  <MiniStat value={`${subStats.best.correct}/${subStats.best.total}`} label="Шилдэг" />
                  <MiniStat value={`${subStats.avg}%`} label="Дундаж" />
                </View>
              ) : (
                <Text style={styles.emptyNote}>Энэ дэд ангиллаар оролдлого байхгүй байна — эхлээд шалгалт өгнө үү.</Text>
              )}
              <PressableScale onPress={startSubExam} scaleTo={0.98}>
                <View style={styles.secondary}>
                  <Text style={styles.secondaryText}>Эхлэх — бүх {subPick.count} сорилго</Text>
                  <Icon name="arrowRight" size={15} color={colors.text} />
                </View>
              </PressableScale>
            </>
          ) : (
            <Text style={styles.emptyNote}>Дэд ангилал сонгоход оролдлогын дүн болон бүх сорилгоор шалгалт эхлүүлэх товч гарна.</Text>
          )}
        </GlassCard>
      </Reveal>

      <SectionHeader title="Үндсэн шалгалт" caption="Жинхэнэ шалгалтын бүтэцтэй 200 сорилго" />
      <Reveal delay={200}>
        <LinearGradient colors={["#1B1E23", "#111317"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainExam}>
          <View style={styles.cardHead}>
            <View style={[styles.headIcon, styles.mainIcon]}>
              <Icon name="scale" size={17} color={colors.lilac} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>Үндсэн шалгалт</Text>
              <Text style={styles.mainCaption}>
                Иргэний, захиргааны, эрүүгийн хууль болон процессын 60%, ёс зүйн 10%, бусад салбарын 30% бүрдэлтэй.
              </Text>
            </View>
          </View>
          <View style={styles.mainStats}>
            <MiniStat value="200" label="Сорилго" dark />
            <MiniStat value="200" label="Минут" dark />
            <MiniStat value={mainStats ? `${mainStats.avg}%` : "—"} label={mainStats ? `Дундаж · ${mainStats.n}` : "Дундаж"} dark />
          </View>
          <View style={styles.tagRow}>
            <View style={styles.mainTag}><Text style={styles.mainTagText}>200 сорилго</Text></View>
            <View style={styles.mainTag}><Text style={styles.mainTagText}>200 минут</Text></View>
            <View style={styles.mainTag}><Text style={styles.mainTagText}>1 мин / сорилго</Text></View>
          </View>
          {mainStats ? (
            <Text style={styles.mainLast}>
              Сүүлд: {mainStats.last.correct}/{mainStats.last.total} · Шилдэг: {mainStats.best.correct}/{mainStats.best.total}
            </Text>
          ) : null}
          <PressableScale onPress={startMainExam} disabled={bank.questions.length === 0} scaleTo={0.98}>
            <View style={[styles.mainStart, bank.questions.length === 0 && { opacity: 0.4 }]}>
              <Text style={styles.mainStartText}>Үндсэн шалгалт эхлэх</Text>
              <Icon name="arrowRight" size={16} color={colors.white} />
            </View>
          </PressableScale>
        </LinearGradient>
      </Reveal>

      <SectionHeader title="Сүүлийн шалгалтууд" caption="Оролдлогын түүх" />
      <Reveal delay={260}>
        <GlassCard style={styles.sectionCard}>
          {lastExams.length > 0 ? (
            lastExams.map((item, index) => {
              const pct = Math.round((item.correct / Math.max(1, item.total)) * 100);
              return (
                <View key={item.id} style={[styles.historyRow, index > 0 && styles.historyDivider]}>
                  <View style={[styles.historyPct, { borderColor: pct >= 60 ? "rgba(52,211,153,0.28)" : "rgba(251,113,133,0.28)" }]}>
                    <Text style={[styles.historyPctText, { color: pct >= 60 ? colors.emerald : colors.rose }]}>{pct}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.historyName}>{item.main}</Text>
                    <Text style={styles.historyMeta}>{item.correct}/{item.total} · {relativeDay(item.at)}</Text>
                  </View>
                  <Text style={styles.historyTime}>{Math.max(1, Math.round(item.seconds / 60))} мин</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyNote}>Шалгалтын түүх хоосон байна. Эхний шалгалтаа эхлүүлээрэй.</Text>
          )}
        </GlassCard>
      </Reveal>

      <SubjectPickerSheet
        visible={picker === "setup"}
        onClose={() => setPicker(null)}
        eyebrow="ШАЛГАЛТ"
        title="Ангилал сонгох"
        onSelect={(nextMain, nextSub) => {
          setMain(nextMain);
          setSub(nextSub);
          setPicker(null);
        }}
      />
      <SubjectPickerSheet
        visible={picker === "subExam"}
        onClose={() => setPicker(null)}
        eyebrow="ДЭД АНГИЛАЛ"
        title="Дэд ангилал сонгох"
        onSelect={(nextMain, nextSub) => {
          if (nextSub) {
            const found = bank.mains.find((m) => m.name === nextMain)?.subs.find((s) => s.name === nextSub);
            setSubPick({ main: nextMain, sub: nextSub, count: found?.count ?? 0 });
          }
          setPicker(null);
        }}
      />
    </Screen>
  );
}

function MiniStat({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
  return (
    <View style={[styles.miniStat, dark && styles.miniStatDark]}>
      <Text style={[styles.miniValue, dark && { color: colors.white }]}>{value}</Text>
      <Text style={[styles.miniLabel, dark && { color: "rgba(255,255,255,0.55)" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsCard: { marginTop: 18, padding: 16 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 11 },
  headIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  cardCaption: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 3, lineHeight: 15 },
  badge: {
    minWidth: 36,
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted },
  label: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.5, color: colors.dim, marginTop: 20, marginBottom: 8 },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  selectIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  selectValue: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.text },
  selectMeta: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 3 },
  row: { flexDirection: "row", gap: 8 },
  typeBtn: {
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  typeActive: { borderColor: "rgba(255,255,255,0.24)", backgroundColor: "rgba(255,255,255,0.10)" },
  typeText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.muted },
  typeTextActive: { color: colors.white },
  countWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  countChip: {
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  countChipActive: { borderColor: "rgba(255,255,255,0.24)", backgroundColor: "rgba(255,255,255,0.10)" },
  countText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.muted },
  countTextActive: { color: colors.white },
  customRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 9 },
  customLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim },
  customInput: {
    width: 82,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
    paddingHorizontal: 11,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.text,
  },
  customChosen: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  modeActive: { borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(255,255,255,0.09)" },
  modeTitle: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  modeTitleActive: { color: colors.white },
  modeCaption: { fontFamily: fonts.body, fontSize: 8.5, color: colors.dim, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  miniStat: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    padding: 10,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  miniStatDark: { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.10)" },
  miniValue: { fontFamily: fonts.display, fontSize: 17, color: colors.text, letterSpacing: -0.3 },
  miniLabel: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, marginTop: 3 },
  hint: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 10, lineHeight: 14 },
  primary: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 16,
  },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white },
  sectionCard: { padding: 14 },
  emptyNote: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.dim,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.028)",
  },
  secondary: {
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  secondaryText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  mainExam: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    overflow: "hidden",
  },
  mainIcon: { backgroundColor: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.14)" },
  mainTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.white, letterSpacing: -0.3 },
  mainCaption: { fontFamily: fonts.body, fontSize: 10, lineHeight: 15, color: "rgba(255,255,255,0.55)", marginTop: 4 },
  mainStats: { flexDirection: "row", gap: 8, marginTop: 14 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  mainTag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mainTagText: { fontFamily: fonts.bodySemi, fontSize: 9, color: "rgba(255,255,255,0.7)" },
  mainLast: { fontFamily: fonts.body, fontSize: 9.5, color: "rgba(255,255,255,0.5)", marginTop: 10, textAlign: "center" },
  mainStart: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  mainStartText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.white },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  historyDivider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.045)" },
  historyPct: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  historyPctText: { fontFamily: fonts.display, fontSize: 12 },
  historyName: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.text },
  historyMeta: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 2 },
  historyTime: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
});
