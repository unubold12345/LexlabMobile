import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { GlassCard, PressableScale, Reveal, SectionHeader } from "@/components/ui";
import { useBank } from "@/lib/bank";
import { createLaunch, shuffle } from "@/lib/quizLaunch";
import { colors, fonts } from "@/lib/theme";
import type { QuizMode } from "@/lib/types";

type Pair = { key: string; main: string; sub: string; count: number };
type Bundle = { kind: string; title: string; desc: string; pairs: Pair[]; total: number };

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

export default function Custom() {
  const router = useRouter();
  const bank = useBank();
  const [sel, setSel] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<QuizMode>("exam");

  const pairs = useMemo<Pair[]>(() => {
    const out: Pair[] = [];
    for (const group of bank.mains) {
      for (const item of group.subs) {
        if (item.count > 0) out.push({ key: `${group.name}\u0001${item.name}`, main: group.name, sub: item.name, count: item.count });
      }
    }
    return out;
  }, [bank.mains]);

  const byMain = useMemo(() => {
    const map = new Map<string, Pair[]>();
    for (const pair of pairs) {
      const list = map.get(pair.main);
      if (list) list.push(pair);
      else map.set(pair.main, [pair]);
    }
    return [...map.entries()].map(([main, list]) => ({
      main,
      pairs: list,
      avail: list.reduce((sum, p) => sum + p.count, 0),
      sel: list.reduce((sum, p) => sum + (sel[p.key] ?? 0), 0),
    }));
  }, [pairs, sel]);

  const selectedTotal = useMemo(() => Object.values(sel).reduce((sum, n) => sum + (n > 0 ? n : 0), 0), [sel]);
  const availableTotal = useMemo(() => pairs.reduce((sum, p) => sum + p.count, 0), [pairs]);

  const bundles = useMemo<Bundle[]>(() => {
    const small: Bundle[] = [];
    for (const group of byMain) {
      const smallPairs = group.pairs.filter((p) => p.count < 10);
      if (smallPairs.length < 2) continue;
      small.push({
        kind: "Цөөн сорилготой",
        title: `${shortName(group.main)} — цөөн сорилготой`,
        desc: `10-аас цөөн сорилготой ${smallPairs.length} дэд ангиллыг нэгтгэсэн`,
        pairs: smallPairs,
        total: smallPairs.reduce((sum, p) => sum + p.count, 0),
      });
    }
    const bySub = new Map<string, Pair[]>();
    for (const pair of pairs) {
      const list = bySub.get(pair.sub);
      if (list) list.push(pair);
      else bySub.set(pair.sub, [pair]);
    }
    const same: Bundle[] = [];
    for (const [sub, list] of bySub) {
      if (new Set(list.map((p) => p.main)).size < 2) continue;
      same.push({
        kind: "Ижил нэртэй",
        title: sub,
        desc: `${new Set(list.map((p) => p.main)).size} үндсэн ангилалд давтагдсан`,
        pairs: list,
        total: list.reduce((sum, p) => sum + p.count, 0),
      });
    }
    return [...same, ...small].slice(0, 6);
  }, [byMain, pairs]);

  const bump = useCallback((key: string, delta: number, max: number) => {
    setSel((prev) => {
      const value = Math.max(0, Math.min((prev[key] ?? 0) + delta, max));
      return { ...prev, [key]: value };
    });
  }, []);

  const setFull = useCallback((key: string, max: number) => {
    setSel((prev) => ({ ...prev, [key]: max }));
  }, []);

  const toggle = useCallback((key: string, max: number) => {
    setSel((prev) => ({ ...prev, [key]: (prev[key] ?? 0) > 0 ? 0 : max }));
  }, []);

  const addPairs = useCallback((list: Pair[]) => {
    setSel((prev) => {
      const next = { ...prev };
      for (const pair of list) next[pair.key] = pair.count;
      return next;
    });
  }, []);

  const start = () => {
    const ids: string[] = [];
    for (const [key, count] of Object.entries(sel)) {
      if (count <= 0) continue;
      const sep = key.indexOf("\u0001");
      const main = key.slice(0, sep);
      const sub = key.slice(sep + 1);
      const pool = bank.questions.filter((q) => q.category === main && q.subCategory === sub);
      ids.push(...shuffle(pool).slice(0, Math.min(count, pool.length)).map((q) => q.id));
    }
    if (ids.length === 0) return;
    const launch = createLaunch({
      ids: shuffle(ids),
      mode,
      minutes: mode === "exam" ? ids.length : 0,
      tag: "Угсарсан шалгалт",
      main: "Угсарсан шалгалт",
      source: "custom",
    });
    router.push({ pathname: "/quiz", params: { launch } });
  };

  return (
    <Screen>
      <PageHeader backTo="/practice" />

      <Reveal delay={60}>
        <GlassCard style={styles.summary}>
          <View style={styles.summaryHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Шалгалт угсрах</Text>
              <Text style={styles.summaryCaption}>Сонгосон дэд ангиллуудаас холимог шалгалт үүснэ.</Text>
            </View>
            <View style={styles.modeToggle}>
              {(["exam", "practice"] as QuizMode[]).map((value) => (
                <PressableScale key={value} onPress={() => setMode(value)} scaleTo={0.95}>
                  <View style={[styles.modeBtn, mode === value && styles.modeActive]}>
                    <Text style={[styles.modeText, mode === value && styles.modeTextActive]}>
                      {value === "exam" ? "Шалгалт" : "Сургалт"}
                    </Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          </View>

          <View style={styles.statsRow}>
            <MiniStat value={String(selectedTotal)} label="Сонгосон" />
            <MiniStat value={String(availableTotal)} label="Нийт сан" />
            <MiniStat value={mode === "exam" ? `${selectedTotal} мин` : "∞"} label="Хугацаа" />
          </View>

          <View style={styles.startRow}>
            <PressableScale onPress={start} disabled={selectedTotal === 0} scaleTo={0.98} style={{ flex: 1 }}>
              <LinearGradient
                colors={["#4F5763", "#30353D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.startBtn, selectedTotal === 0 && { opacity: 0.4 }]}
              >
                <Icon name="play" size={15} color={colors.white} strokeWidth={2.4} />
                <Text style={styles.startText}>Эхлэх — {selectedTotal} сорилго</Text>
              </LinearGradient>
            </PressableScale>
            {selectedTotal > 0 ? (
              <PressableScale onPress={() => setSel({})} scaleTo={0.95}>
                <View style={styles.clearBtn}>
                  <Icon name="close" size={14} color={colors.muted} />
                </View>
              </PressableScale>
            ) : null}
          </View>
        </GlassCard>
      </Reveal>

      {bundles.length > 0 ? (
        <>
          <SectionHeader title="Ухаалаг багцууд" caption="Бэлэн багцыг нэг товшилтоор нэмнэ" />
          <View style={styles.bundleList}>
            {bundles.map((bundle, index) => (
              <Reveal key={`${bundle.kind}:${bundle.title}`} delay={100 + index * 40}>
                <GlassCard style={styles.bundle}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.bundleTop}>
                      <Text numberOfLines={1} style={styles.bundleTitle}>{bundle.title}</Text>
                      <View style={styles.bundleTag}><Text style={styles.bundleTagText}>{bundle.kind}</Text></View>
                    </View>
                    <Text numberOfLines={2} style={styles.bundleDesc}>{bundle.desc}</Text>
                    <Text style={styles.bundleMeta}>{bundle.pairs.length} ангилал · {bundle.total} сорилго</Text>
                  </View>
                  <PressableScale onPress={() => addPairs(bundle.pairs)} scaleTo={0.95}>
                    <View style={styles.addBtn}>
                      <Icon name="plus" size={13} color={colors.lilac} />
                      <Text style={styles.addText}>Нэмэх</Text>
                    </View>
                  </PressableScale>
                </GlassCard>
              </Reveal>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Ангиллаар сонгох" caption="Тоон дээр дарвал бүх сорилгыг авна" />
      <View style={styles.mainList}>
        {byMain.map((group, index) => {
          const isOpen = open[group.main] ?? false;
          return (
            <Reveal key={group.main} delay={120 + index * 30}>
              <GlassCard>
                <View style={styles.mainHead}>
                  <PressableScale
                    onPress={() => setOpen((prev) => ({ ...prev, [group.main]: !isOpen }))}
                    scaleTo={0.99}
                    style={{ flex: 1 }}
                  >
                    <View style={styles.mainHeadInner}>
                      <View style={styles.mainIcon}>
                        <Text style={styles.mainLetter}>{shortName(group.main).charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={styles.mainName}>{shortName(group.main)}</Text>
                        <Text style={styles.mainMeta}>{group.sel}/{group.avail} сонгосон</Text>
                      </View>
                      <View style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}>
                        <Icon name="chevronRight" size={15} color={colors.dim} />
                      </View>
                    </View>
                  </PressableScale>
                  <PressableScale onPress={() => addPairs(group.pairs)} scaleTo={0.95}>
                    <View style={styles.allBtn}>
                      <Text style={styles.allText}>Бүгд</Text>
                    </View>
                  </PressableScale>
                </View>

                {isOpen ? (
                  <View style={styles.subList}>
                    {group.pairs.map((pair) => {
                      const value = Math.max(sel[pair.key] ?? 0, 0);
                      const on = value > 0;
                      return (
                        <View key={pair.key} style={styles.subRow}>
                          <PressableScale onPress={() => toggle(pair.key, pair.count)} scaleTo={0.9}>
                            <View style={[styles.check, on && styles.checkOn]}>
                              {on ? <Icon name="check" size={11} color={colors.white} strokeWidth={2.6} /> : null}
                            </View>
                          </PressableScale>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={2} style={styles.subName}>{pair.sub}</Text>
                            <Text style={styles.subCount}>/{pair.count}</Text>
                          </View>
                          <View style={styles.stepper}>
                            <PressableScale onPress={() => bump(pair.key, -1, pair.count)} disabled={value <= 0} scaleTo={0.9}>
                              <View style={[styles.stepBtn, value <= 0 && { opacity: 0.3 }]}>
                                <Text style={styles.stepText}>−</Text>
                              </View>
                            </PressableScale>
                            <PressableScale onPress={() => setFull(pair.key, pair.count)} scaleTo={0.95}>
                              <View style={styles.stepValue}>
                                <Text style={styles.stepValueText}>{value}</Text>
                              </View>
                            </PressableScale>
                            <PressableScale onPress={() => bump(pair.key, 1, pair.count)} disabled={value >= pair.count} scaleTo={0.9}>
                              <View style={[styles.stepBtn, value >= pair.count && { opacity: 0.3 }]}>
                                <Text style={styles.stepText}>+</Text>
                              </View>
                            </PressableScale>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </GlassCard>
            </Reveal>
          );
        })}
      </View>

      <Reveal delay={260}>
        <View style={styles.footer}>
          <Icon name="layers" size={13} color={colors.dim} />
          <Text style={styles.footerText}>Сонгосон сорилгуудыг холиод нэг шалгалт болгон угсарна.</Text>
        </View>
      </Reveal>
    </Screen>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: 18, padding: 16 },
  summaryHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  summaryTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
  summaryCaption: { fontFamily: fonts.body, fontSize: 9.5, lineHeight: 14, color: colors.dim, marginTop: 4 },
  modeToggle: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  modeBtn: { paddingHorizontal: 10, height: 30, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  modeActive: { backgroundColor: "rgba(255,255,255,0.11)" },
  modeText: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.dim },
  modeTextActive: { color: colors.white },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 15 },
  miniStat: {
    flex: 1,
    minHeight: 55,
    borderRadius: 13,
    padding: 10,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.032)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  miniValue: { fontFamily: fonts.display, fontSize: 16, color: colors.text, letterSpacing: -0.3 },
  miniLabel: { fontFamily: fonts.body, fontSize: 8.5, color: colors.dim, marginTop: 3 },
  startRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 13 },
  startBtn: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  clearBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  bundleList: { gap: 8 },
  bundle: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bundleTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  bundleTitle: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.text },
  bundleTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  bundleTagText: { fontFamily: fonts.bodySemi, fontSize: 7.5, color: colors.muted },
  bundleDesc: { fontFamily: fonts.body, fontSize: 9, lineHeight: 13, color: colors.dim, marginTop: 4 },
  bundleMeta: { fontFamily: fonts.body, fontSize: 8.5, color: colors.dim, marginTop: 5 },
  addBtn: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.lilac },
  mainList: { gap: 10 },
  mainHead: { flexDirection: "row", alignItems: "center", gap: 8, padding: 6, paddingRight: 12 },
  mainHeadInner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8 },
  mainIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  mainLetter: { fontFamily: fonts.display, fontSize: 14, color: colors.lilac },
  mainName: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.text },
  mainMeta: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, marginTop: 3 },
  allBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  allText: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.muted },
  subList: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", paddingHorizontal: 12, paddingBottom: 6 },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.035)",
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  checkOn: { backgroundColor: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.28)" },
  subName: { fontFamily: fonts.bodyMedium, fontSize: 10.5, lineHeight: 15, color: colors.muted },
  subCount: { fontFamily: fonts.body, fontSize: 8.5, color: colors.dim, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 2 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  stepText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  stepValue: { width: 34, height: 30, alignItems: "center", justifyContent: "center" },
  stepValueText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.text },
  footer: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 18, opacity: 0.75 },
  footerText: { flex: 1, fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, lineHeight: 14 },
});
