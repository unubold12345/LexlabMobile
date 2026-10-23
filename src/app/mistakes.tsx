import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { GlassCard, PressableScale, Reveal, Tag } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useBank } from "@/lib/bank";
import { useProgress } from "@/lib/progress";
import { createLaunch } from "@/lib/quizLaunch";
import { colors, fonts } from "@/lib/theme";

type MistakeRow = { questionId: string; wrongCount: number; manual: boolean };

export default function Mistakes() {
  const router = useRouter();
  const auth = useAuth();
  const bank = useBank();
  const progress = useProgress();
  const [serverRows, setServerRows] = useState<MistakeRow[]>([]);
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    if (!auth.token) {
      setServerRows([]);
      return;
    }
    try {
      const res = await auth.apiFetch("/api/mistakes");
      if (!res.ok) return;
      const data = (await res.json()) as { mistakes?: MistakeRow[] };
      if (Array.isArray(data.mistakes)) setServerRows(data.mistakes);
    } catch {}
  }, [auth.token, auth.apiFetch]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const questionById = useMemo(() => new Map(bank.questions.map((q) => [q.id, q])), [bank.questions]);
  const localIds = useMemo(() => Object.keys(progress.wrong), [progress.wrong]);

  const rows = useMemo(() => {
    const merged = new Map<string, { id: string; wrongCount: number; manual: boolean }>();
    for (const id of localIds) {
      if (questionById.has(id)) merged.set(id, { id, wrongCount: 1, manual: false });
    }
    for (const row of serverRows) {
      if (row.wrongCount < 2 && !row.manual && !merged.has(row.questionId)) continue;
      if (!questionById.has(row.questionId)) continue;
      merged.set(row.questionId, { id: row.questionId, wrongCount: row.wrongCount, manual: row.manual });
    }
    return [...merged.values()].sort((a, b) => b.wrongCount - a.wrongCount);
  }, [localIds, serverRows, questionById]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startExam = () => {
    if (rows.length === 0) return;
    const key = createLaunch({
      ids: rows.map((row) => row.id),
      mode: "exam",
      minutes: rows.length,
      tag: "Их алддаг",
      main: "Их алддаг",
      source: "mistakes",
    });
    router.push({ pathname: "/quiz", params: { launch: key } });
  };

  return (
    <Screen>
      <PageHeader backTo="/practice" />

      {rows.length > 0 ? (
        <>
          <Reveal delay={60}>
            <LinearGradient colors={["#1B1E23", "#111317"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroIcon}>
                <Icon name="trending" size={18} color={colors.lilac} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{rows.length} асуулт</Text>
                <Text style={styles.heroText}>Алдсан асуултуудаар шалгалт өгч, мэдлэгээ бэхжүүлээрэй.</Text>
              </View>
              <PressableScale onPress={startExam} scaleTo={0.95}>
                <View style={styles.heroBtn}>
                  <Icon name="play" size={14} color={colors.white} strokeWidth={2.4} />
                </View>
              </PressableScale>
            </LinearGradient>
          </Reveal>

          <Reveal delay={90}>
            <PressableScale onPress={startExam} scaleTo={0.98}>
              <View style={styles.startBtn}>
                <Icon name="play" size={15} color={colors.white} strokeWidth={2.4} />
                <Text style={styles.startText}>Эдгээрээр шалгалт өгөх</Text>
                <Icon name="arrowRight" size={15} color={colors.white} />
              </View>
            </PressableScale>
          </Reveal>

          <View style={styles.list}>
            {visible.map((row, index) => {
              const question = questionById.get(row.id);
              if (!question) return null;
              return (
                <Reveal key={row.id} delay={110 + index * 35}>
                  <GlassCard style={styles.card}>
                    <View style={styles.cardHead}>
                      <View style={styles.cardIndex}>
                        <Text style={styles.cardIndexText}>{(currentPage - 1) * pageSize + index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={3} style={styles.question}>{question.question}</Text>
                        <Text numberOfLines={1} style={styles.category}>{question.category} · {question.subCategory}</Text>
                      </View>
                      <Tag text={row.wrongCount > 0 ? `✗ ${row.wrongCount}` : "гараар"} tint={colors.rose} />
                    </View>
                    <View style={styles.cardFooter}>
                      <PressableScale
                        onPress={() => {
                          progress.removeWrong(row.id);
                          setServerRows((prev) => prev.filter((item) => item.questionId !== row.id));
                        }}
                        scaleTo={0.95}
                      >
                        <View style={styles.deleteBtn}>
                          <Icon name="close" size={12} color={colors.rose} />
                          <Text style={styles.deleteText}>Устгах</Text>
                        </View>
                      </PressableScale>
                    </View>
                  </GlassCard>
                </Reveal>
              );
            })}
          </View>

          {totalPages > 1 ? (
            <View style={styles.pager}>
              <PressableScale onPress={() => setPage(Math.max(1, currentPage - 1))} scaleTo={0.95} disabled={currentPage <= 1}>
                <View style={[styles.pageBtn, currentPage <= 1 && { opacity: 0.4 }]}>
                  <Icon name="chevronLeft" size={14} color={colors.muted} />
                </View>
              </PressableScale>
              <Text style={styles.pageText}>{currentPage} / {totalPages}</Text>
              <PressableScale onPress={() => setPage(Math.min(totalPages, currentPage + 1))} scaleTo={0.95} disabled={currentPage >= totalPages}>
                <View style={[styles.pageBtn, currentPage >= totalPages && { opacity: 0.4 }]}>
                  <Icon name="chevronRight" size={14} color={colors.muted} />
                </View>
              </PressableScale>
            </View>
          ) : null}
        </>
      ) : (
        <Reveal delay={60}>
          <GlassCard style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="trending" size={22} color={colors.dim} />
            </View>
            <Text style={styles.emptyTitle}>Их алддаг сорилгууд</Text>
            <Text style={styles.emptyText}>
              {auth.token
                ? "Хоёр ба түүнээс дээш удаа алдсан сорилго энд гарна. Шалгалт өгч эхлээрэй."
                : "Нэвтэрч орвол алдсан сорилгууд чинь бүх төхөөрөмжид хадгалагдана."}
            </Text>
            <PressableScale onPress={() => router.push(auth.token ? "/exam-setup" : "/login")} scaleTo={0.97}>
              <View style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>{auth.token ? "Шалгалт эхлэх" : "Нэвтрэх"}</Text>
                <Icon name="arrowRight" size={14} color={colors.text} />
              </View>
            </PressableScale>
          </GlassCard>
        </Reveal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.white },
  heroText: { fontFamily: fonts.body, fontSize: 9.5, lineHeight: 14, color: "rgba(255,255,255,0.55)", marginTop: 3 },
  heroBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  startBtn: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  startText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  list: { gap: 10, marginTop: 16 },
  card: { padding: 14 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardIndex: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.20)",
  },
  cardIndexText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.rose },
  question: { fontFamily: fonts.bodyMedium, fontSize: 11.5, lineHeight: 17, color: colors.text },
  category: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, marginTop: 5 },
  cardFooter: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  deleteBtn: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.22)",
    backgroundColor: "rgba(251,113,133,0.06)",
  },
  deleteText: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.rose },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 },
  pageBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  pageText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted },
  empty: { marginTop: 24, padding: 24, alignItems: "center" },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.text, marginTop: 14 },
  emptyText: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 16, color: colors.dim, marginTop: 6, textAlign: "center" },
  emptyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  emptyBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
});
