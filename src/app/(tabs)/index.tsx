import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/LogoMark";
import { NotificationBell } from "@/components/NotificationBell";
import { ProgressRing } from "@/components/ProgressRing";
import {
  EmptyNote,
  GlassCard,
  PressableScale,
  ProgressBar,
  Reveal,
  SectionHeader,
  StatTile,
  Tag,
} from "@/components/ui";
import { useBank } from "@/lib/bank";
import { useProgress } from "@/lib/progress";
import { greeting, relativeDay } from "@/lib/format";
import { colors, fonts, radii } from "@/lib/theme";

const SUBJECT_TINTS = ["#CDD2DA"];

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

export default function Home() {
  const bank = useBank();
  const progress = useProgress();
  const router = useRouter();

  const heroMain = bank.mains[0];
  const answeredInMain = useMemo(() => {
    if (!heroMain) return 0;
    return bank.questions.reduce(
      (n, q) => n + (q.category === heroMain.name && progress.answered[q.id] ? 1 : 0),
      0
    );
  }, [bank.questions, heroMain, progress.answered]);
  const heroCoverage = answeredInMain / Math.max(1, heroMain?.total ?? 0);
  const maxWeek = Math.max(1, ...progress.week.map((d) => d.count));
  const latest = progress.history.slice(0, 2);
  const initial = progress.name.trim().charAt(0).toUpperCase() || "L";

  const startQuiz = (main: string, mode: "practice" | "exam", count = 10) => {
    router.push({ pathname: "/quiz", params: { main, count: String(count), mode } });
  };

  return (
    <Screen>
      <Reveal>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <LogoMark size={34} glow={false} />
            <View>
              <Text style={styles.brand}>LEXLAB</Text>
              <Text style={styles.brandSub}>LAW EXAM STUDIO</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <NotificationBell />
            <View style={styles.streakPill}>
              <Icon name="flame" size={14} color={colors.amber} strokeWidth={1.9} />
              <Text style={styles.streakText}>{progress.streak}</Text>
            </View>
            <PressableScale onPress={() => router.push("/profile")} scaleTo={0.92}>
              <LinearGradient
                colors={["#5D6470", "#343A43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>
            </PressableScale>
          </View>
        </View>

        <Text style={styles.hello}>
          {greeting()}, {progress.name}
        </Text>
        <PressableScale onPress={() => void bank.refresh()} scaleTo={0.98}>
          <View style={styles.libraryRow}>
            <View style={[styles.libraryDot, bank.lastError && { backgroundColor: colors.rose }]} />
            <Text style={[styles.libraryText, bank.lastError && { color: colors.rose }]}>
              {bank.lastError
                ? "Асуултын сан татагдсангүй · Дахин оролдох"
                : `${bank.total.toLocaleString()} асуулт · ${bank.mains.length} сэдэв`}
            </Text>
            {bank.live ? <Tag text="Шинэ" tint={colors.emerald} /> : null}
          </View>
        </PressableScale>
      </Reveal>

      <Reveal delay={70}>
        <View style={styles.hero}>
          <LinearGradient
            colors={["#3B4048", "#23262C", "#16181C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroGlowA} />
          <View style={styles.heroGlowB} />
          <View style={styles.heroBody}>
            <View style={styles.heroTag}>
              <Icon name="sparkles" size={11} color="#E5E7EB" strokeWidth={2} />
              <Text style={styles.heroTagText}>ӨНӨӨДРИЙН ФОКУС</Text>
            </View>
            <Text numberOfLines={2} style={styles.heroTitle}>
              {shortName(heroMain?.name ?? "Нийтийн эрх зүй")}
            </Text>
            <Text style={styles.heroMeta}>
              {(heroMain?.total ?? 0).toLocaleString()} асуулт · {heroMain?.subs.length ?? 0} дэд сэдэв
            </Text>
            <View style={styles.heroBottom}>
              <PressableScale onPress={() => startQuiz(heroMain?.name ?? "all", "practice", 10)} scaleTo={0.95}>
                <View style={styles.heroBtn}>
                  <Icon name="play" size={12} color={colors.text} strokeWidth={2.4} />
                  <Text style={styles.heroBtnText}>Эхлэх</Text>
                </View>
              </PressableScale>
              <Text style={styles.heroCoverage}>{answeredInMain} үзсэн</Text>
            </View>
          </View>
          <View style={styles.heroRing}>
            <ProgressRing
              size={94}
              stroke={7}
              progress={heroCoverage}
              from="#FFFFFF"
              to="#FBCFE8"
              track="rgba(255,255,255,0.18)"
            >
              <Text style={styles.heroRingValue}>{Math.round(heroCoverage * 100)}%</Text>
              <Text style={styles.heroRingLabel}>хамралт</Text>
            </ProgressRing>
          </View>
        </View>
      </Reveal>

      <View style={styles.statsRow}>
        <StatTile icon="bolt" value={`${progress.xp}`} label="XP оноо" tint={colors.lilac} delay={110} />
        <StatTile icon="flame" value={`${progress.streak}`} label="Өдрийн цуваа" tint={colors.lilac} delay={160} />
        <StatTile icon="target" value={`${progress.accuracyPct}%`} label="Нарийвчлал" tint={colors.lilac} delay={210} />
      </View>

      <SectionHeader title="Сэдвүүд" caption="Үргэлжлүүлэх эсвэл шинээр эхлэх" action="Бүгд" onAction={() => router.push("/subjects")} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subjectScroll}
      >
        {bank.mains.map((main, i) => {
          const answered = bank.questions.reduce(
            (n, q) => n + (q.category === main.name && progress.answered[q.id] ? 1 : 0),
            0
          );
          const tint = SUBJECT_TINTS[i % SUBJECT_TINTS.length];
          return (
            <Reveal key={main.name} delay={80 + i * 50}>
              <PressableScale onPress={() => startQuiz(main.name, "practice", 10)}>
                <GlassCard style={styles.subjectCard}>
                  <View style={[styles.subjectIcon, { backgroundColor: `${tint}1c`, borderColor: `${tint}30` }]}>
                    <Text style={[styles.subjectLetter, { color: tint }]}>{shortName(main.name).charAt(0)}</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.subjectName}>
                    {shortName(main.name)}
                  </Text>
                  <Text style={styles.subjectCount}>{main.total.toLocaleString()} асуулт</Text>
                  <View style={styles.subjectProgress}>
                    <View style={{ flex: 1 }}>
                      <ProgressBar progress={answered / Math.max(1, main.total)} height={4} from={tint} to={tint} />
                    </View>
                    <Text style={styles.subjectPct}>{Math.round((answered / Math.max(1, main.total)) * 100)}%</Text>
                  </View>
                </GlassCard>
              </PressableScale>
            </Reveal>
          );
        })}
      </ScrollView>

      <SectionHeader title="Долоо хоногийн идэвх" caption="Сүүлийн 7 хоногийн дасгал" />
      <Reveal delay={80}>
        <GlassCard style={styles.chartCard}>
          <View style={styles.chart}>
            {progress.week.map((d, i) => (
              <View key={i} style={styles.chartCol}>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${Math.max(9, (d.count / maxWeek) * 100)}%`,
                        opacity: d.count === 0 ? 0.22 : 1,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={d.today ? ["#D4D7DC", "#8B919B"] : ["#5A616C", "#343A43"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                </View>
                <Text style={[styles.chartLabel, d.today && styles.chartLabelToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartSummary}>
            <Text style={styles.chartSummaryValue}>{progress.todaySessions}</Text>
            <Text style={styles.chartSummaryLabel}>өнөөдрийн дасгал</Text>
            <View style={styles.chartSummaryDot} />
            <Text style={styles.chartSummaryValue}>{progress.todayMinutes}</Text>
            <Text style={styles.chartSummaryLabel}>/ {progress.dailyGoal} мин</Text>
          </View>
        </GlassCard>
      </Reveal>

      <SectionHeader title="Өнөөдрийн сорил" caption="Холимог асуултууд · шалгалтын горим" />
      <Reveal delay={70}>
        <PressableScale onPress={() => startQuiz("all", "exam", 10)}>
          <View style={styles.examCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.055)", "rgba(255,255,255,0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.examIcon}>
              <LinearGradient
                colors={["#5D6470", "#343A43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Icon name="bolt" size={22} color={colors.white} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.examTitle}>10 асуултын сорил</Text>
              <Text style={styles.examMeta}>Хугацаатай · үр дүнгийн шинжилгээтэй</Text>
            </View>
            <View style={styles.examArrow}>
              <Icon name="arrowRight" size={18} color={colors.text} />
            </View>
          </View>
        </PressableScale>
      </Reveal>

      <SectionHeader title="Сүүлийн дасгал" caption="Таны сүүлийн үр дүнгүүд" action={latest.length ? "Бүгд" : undefined} onAction={() => router.push("/practice")} />
      {latest.length === 0 ? (
        <EmptyNote text="Эхний дасгалаа хийгээд явцаа эндээс хянаарай." />
      ) : (
        <View style={{ gap: 10 }}>
          {latest.map((item, i) => {
            const pct = Math.round((item.correct / Math.max(1, item.total)) * 100);
            const tint = pct >= 70 ? colors.emerald : pct >= 40 ? colors.amber : colors.rose;
            return (
              <Reveal key={item.id} delay={60 + i * 60}>
                <GlassCard style={styles.historyRow}>
                  <View style={[styles.historyRing, { borderColor: `${tint}55` }]}>
                    <Text style={[styles.historyPct, { color: tint }]}>{pct}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.historyTitle}>
                      {shortName(item.main) || "Холимог"}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {item.correct}/{item.total} зөв · {relativeDay(item.at)}
                    </Text>
                  </View>
                  <Icon name="chevronRight" size={16} color={colors.dim} />
                </GlassCard>
              </Reveal>
            );
          })}
        </View>
      )}

      <View style={styles.quickRow}>
        <PressableScale
          style={{ flex: 1 }}
          onPress={() =>
            router.push(
              Object.keys(progress.wrong).length > 0
                ? {
                    pathname: "/quiz",
                    params: {
                      main: "all",
                      count: String(Math.min(10, Object.keys(progress.wrong).length)),
                      mode: "practice",
                      source: "wrong",
                    },
                  }
                : "/practice"
            )
          }
        >
          <GlassCard style={styles.quickCard}>
            <Icon name="refresh" size={17} color={colors.rose} />
            <Text style={styles.quickLabel}>Алдсан асуулт</Text>
            <Text style={styles.quickValue}>{Object.keys(progress.wrong).length}</Text>
          </GlassCard>
        </PressableScale>
        <PressableScale
          style={{ flex: 1 }}
          onPress={() =>
            router.push(
              progress.bookmarks.length > 0
                ? {
                    pathname: "/quiz",
                    params: {
                      main: "all",
                      count: String(Math.min(10, progress.bookmarks.length)),
                      mode: "practice",
                      source: "bookmarked",
                    },
                  }
                : "/practice"
            )
          }
        >
          <GlassCard style={styles.quickCard}>
            <Icon name="bookmark" size={17} color={colors.lilac} />
            <Text style={styles.quickLabel}>Хадгалсан</Text>
            <Text style={styles.quickValue}>{progress.bookmarks.length}</Text>
          </GlassCard>
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { fontFamily: fonts.display, fontSize: 14.5, letterSpacing: 2.4, color: colors.text },
  brandSub: { fontFamily: fonts.bodyBold, fontSize: 7.5, letterSpacing: 2, color: colors.dim, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 11 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  streakText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.amber },
  avatar: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.display, fontSize: 15, color: colors.white },
  hello: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 26,
  },
  libraryRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
  libraryDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.emerald },
  libraryText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.dim },
  hero: {
    marginTop: 20,
    borderRadius: radii.xl,
    padding: 20,
    minHeight: 196,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  heroGlowA: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -120,
    right: -40,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroGlowB: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: -110,
    left: -50,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroBody: { flex: 1, paddingRight: 6, justifyContent: "space-between" },
  heroTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroTagText: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.6, color: "rgba(255,255,255,0.78)" },
  heroTitle: { fontFamily: fonts.display, fontSize: 22.5, color: colors.white, letterSpacing: -0.6, lineHeight: 28, marginTop: 10, maxWidth: 200 },
  heroMeta: { fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,255,255,0.66)", marginTop: 7 },
  heroBottom: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  heroBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  heroCoverage: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: "rgba(255,255,255,0.6)" },
  heroRing: { justifyContent: "center", alignItems: "flex-end" },
  heroRingValue: { fontFamily: fonts.display, fontSize: 19, color: colors.white },
  heroRingLabel: { fontFamily: fonts.body, fontSize: 8.5, color: "rgba(255,255,255,0.66)", marginTop: 1 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  subjectScroll: { gap: 12, paddingRight: 20 },
  subjectCard: { width: 156, padding: 14, minHeight: 146 },
  subjectIcon: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  subjectLetter: { fontFamily: fonts.display, fontSize: 15 },
  subjectName: { fontFamily: fonts.bodySemi, fontSize: 13.2, color: colors.text, lineHeight: 18, marginTop: 12, minHeight: 36 },
  subjectCount: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 4 },
  subjectProgress: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
  subjectPct: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.muted, width: 26, textAlign: "right" },
  chartCard: { padding: 16 },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 9, height: 100 },
  chartCol: { flex: 1, alignItems: "center", gap: 8, height: "100%" },
  chartTrack: { flex: 1, width: "100%", justifyContent: "flex-end", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden" },
  chartBar: { width: "100%", borderRadius: 8, overflow: "hidden" },
  chartLabel: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.dim },
  chartLabelToday: { color: colors.lilac },
  chartSummary: { flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  chartSummaryValue: { fontFamily: fonts.display, fontSize: 15, color: colors.text },
  chartSummaryLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim },
  chartSummaryDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.dim, marginHorizontal: 4 },
  examCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radii.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  examIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  examTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text },
  examMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 3 },
  examArrow: { width: 34, height: 34, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13 },
  historyRing: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  historyPct: { fontFamily: fonts.display, fontSize: 12 },
  historyTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  historyMeta: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 3 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  quickCard: { padding: 14, gap: 6 },
  quickLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.muted },
  quickValue: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
});
