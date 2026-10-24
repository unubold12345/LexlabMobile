import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { QuizSetupSheet } from "@/components/QuizSetupSheet";
import { Chip, GlassCard, PressableScale, ProgressBar, Reveal } from "@/components/ui";
import { useBank } from "@/lib/bank";
import { useProgress } from "@/lib/progress";
import { colors, fonts, radii } from "@/lib/theme";

const TINTS = ["#CDD2DA"];

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

export default function Drill() {
  const bank = useBank();
  const progress = useProgress();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [setup, setSetup] = useState<{ main: string; sub: string; total: number } | null>(null);

  const answeredByMain = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of bank.questions) {
      if (progress.answered[q.id]) map.set(q.category, (map.get(q.category) || 0) + 1);
    }
    return map;
  }, [bank.questions, progress.answered]);

  const answeredBySub = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of bank.questions) {
      if (progress.answered[q.id]) {
        const key = `${q.category}\u0001${q.subCategory}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [bank.questions, progress.answered]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bank.mains
      .filter((m) => filter === "all" || m.name === filter)
      .map((m) => {
        const subs = q
          ? m.subs.filter((s) => s.name.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
          : m.subs;
        return { ...m, subs, filteredTotal: subs.reduce((n, s) => n + s.count, 0) };
      })
      .filter((m) => (q ? m.subs.length > 0 : true));
  }, [bank.mains, query, filter]);

  const totalAnswered = Object.keys(progress.answered).length;

  return (
    <Screen>
      <PageHeader />

      <Reveal delay={60}>
        <View style={styles.searchWrap}>
          <Icon name="search" size={17} color={colors.dim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Сэдэв эсвэл дэд сэдэв хайх"
            placeholderTextColor={colors.dim}
            selectionColor={colors.violet}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {query ? (
            <PressableScale onPress={() => setQuery("")} scaleTo={0.9}>
              <View style={styles.clear}>
                <Icon name="close" size={12} color={colors.muted} />
              </View>
            </PressableScale>
          ) : null}
        </View>
      </Reveal>

      <Reveal delay={100}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{bank.total.toLocaleString()}</Text>
            <Text style={styles.metaLabel}>нийт асуулт</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{totalAnswered.toLocaleString()}</Text>
            <Text style={styles.metaLabel}>үзсэн</Text>
          </View>
          <View style={{ flex: 1 }} />
          <PressableScale onPress={() => bank.refresh()} scaleTo={0.94}>
            <View style={styles.sync}>
              <View style={[styles.syncDot, { backgroundColor: bank.live ? colors.emerald : colors.amber }]} />
              <Text style={styles.syncText}>{bank.syncing ? "Шинэчилж байна" : bank.live ? "Онлайн сан" : "Локал сан"}</Text>
              <Icon name="refresh" size={13} color={colors.dim} />
            </View>
          </PressableScale>
        </View>
      </Reveal>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip label="Бүгд" active={filter === "all"} onPress={() => setFilter("all")} />
        {bank.mains.map((m) => (
          <Chip
            key={m.name}
            label={shortName(m.name)}
            active={filter === m.name}
            onPress={() => setFilter(m.name)}
          />
        ))}
      </ScrollView>

      <View style={{ gap: 12, marginTop: 18 }}>
        {visible.map((main, i) => {
          const isOpen = expanded === main.name || !!query;
          const answered = answeredByMain.get(main.name) || 0;
          const pct = answered / Math.max(1, main.total);
          const tint = TINTS[i % TINTS.length];
          return (
            <Reveal key={main.name} delay={60 + i * 55}>
              <GlassCard>
                <PressableScale onPress={() => setExpanded(isOpen && !query ? null : main.name)} haptic>
                  <View style={styles.mainHead}>
                    <View style={[styles.mainIcon, { backgroundColor: `${tint}18`, borderColor: `${tint}30` }]}>
                      <Text style={[styles.mainLetter, { color: tint }]}>{shortName(main.name).charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mainName}>{shortName(main.name)}</Text>
                      <Text style={styles.mainMeta}>
                        {main.total.toLocaleString()} асуулт · {main.subs.length} дэд сэдэв
                      </Text>
                    </View>
                    <Chevron open={isOpen} />
                  </View>
                  <View style={styles.mainProgress}>
                    <View style={{ flex: 1 }}>
                      <ProgressBar progress={pct} height={4} from={tint} to={tint} />
                    </View>
                    <Text style={styles.mainPct}>{Math.round(pct * 100)}%</Text>
                  </View>
                </PressableScale>

                {isOpen ? (
                  <View style={styles.subList}>
                    {main.subs.map((sub) => {
                      const subAnswered = answeredBySub.get(`${main.name}\u0001${sub.name}`) || 0;
                      const subPct = subAnswered / Math.max(1, sub.count);
                      return (
                        <PressableScale
                          key={sub.name}
                          onPress={() => setSetup({ main: main.name, sub: sub.name, total: sub.count })}
                        >
                          <View style={styles.subRow}>
                            <View style={styles.subInfo}>
                              <Text numberOfLines={2} style={styles.subName}>
                                {sub.name}
                              </Text>
                              <Text style={styles.subMeta}>
                                {sub.count} асуулт · {Math.round(subPct * 100)}% үзсэн
                              </Text>
                            </View>
                            <View style={[styles.subStart, { borderColor: `${tint}33`, backgroundColor: `${tint}12` }]}>
                              <Icon name="play" size={12} color={tint} strokeWidth={2.4} />
                            </View>
                          </View>
                        </PressableScale>
                      );
                    })}
                  </View>
                ) : null}
              </GlassCard>
            </Reveal>
          );
        })}
        {visible.length === 0 ? (
          <GlassCard style={{ padding: 20 }}>
            <Text style={styles.emptyText}>Хайлтад тохирох сэдэв олдсонгүй.</Text>
          </GlassCard>
        ) : null}
      </View>

      <Reveal delay={220}>
        <View style={styles.footer}>
          <Icon name="shield" size={14} color={colors.dim} />
          <Text style={styles.footerText}>Асуултын сан Lexlab серверээс автоматаар шинэчлэгдэнэ.</Text>
        </View>
      </Reveal>

      <QuizSetupSheet
        visible={setup !== null}
        main={setup?.main ?? "all"}
        sub={setup?.sub ?? ""}
        total={setup?.total ?? 0}
        onClose={() => setSetup(null)}
        onStart={(nextMode, count) => {
          if (!setup) return;
          const scope = setup;
          setSetup(null);
          router.push({
            pathname: "/quiz",
            params: {
              main: scope.main,
              sub: scope.sub,
              count: String(count),
              mode: nextMode,
            },
          });
        }}
      />
    </Screen>
  );
}

function Chevron({ open }: { open: boolean }) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withTiming(open ? 90 : 0, { duration: 260 });
  }, [open, rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <Icon name="chevronRight" size={17} color={colors.dim} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: colors.text,
    padding: 0,
  },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 16 },
  metaItem: { gap: 2 },
  metaValue: { fontFamily: fonts.display, fontSize: 16, color: colors.text },
  metaLabel: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
  metaDivider: { width: 1, height: 24, backgroundColor: colors.borderSoft },
  sync: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSoft },
  syncDot: { width: 5, height: 5, borderRadius: 3 },
  syncText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted },
  chips: { gap: 8, paddingTop: 18, paddingRight: 20, paddingBottom: 2 },
  mainHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, paddingBottom: 10 },
  mainIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  mainLetter: { fontFamily: fonts.display, fontSize: 17 },
  mainName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  mainMeta: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 3 },
  mainProgress: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  mainPct: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.muted, width: 30, textAlign: "right" },
  subList: { borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingHorizontal: 14, paddingBottom: 6 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.035)" },
  subInfo: { flex: 1 },
  subName: { fontFamily: fonts.bodyMedium, fontSize: 12.3, color: colors.text, lineHeight: 17 },
  subMeta: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 3 },
  subStart: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: "center" },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22, opacity: 0.75 },
  footerText: { flex: 1, fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, lineHeight: 15 },
});
