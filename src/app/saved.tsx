import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { GlassCard, PressableScale, ProgressBar, Reveal } from "@/components/ui";
import { useSavedExams } from "@/lib/savedExams";
import { clock, relativeDay } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

export default function Saved() {
  const router = useRouter();
  const saved = useSavedExams();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void saved.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const target = saved.exams.find((exam) => exam.key === pendingDelete) ?? null;

  return (
    <Screen>
      <PageHeader backTo="/practice" />

      {saved.loading ? (
        <Text style={styles.loading}>Уншиж байна…</Text>
      ) : saved.exams.length === 0 ? (
        <Reveal delay={60}>
          <GlassCard style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="bookmark" size={22} color={colors.dim} />
            </View>
            <Text style={styles.emptyTitle}>Хадгалсан шалгалт байхгүй</Text>
            <Text style={styles.emptyText}>Шалгалтын үеэр түр зогсоож хадгалахад энд гарч ирнэ.</Text>
            <PressableScale onPress={() => router.push("/exam-setup")} scaleTo={0.97}>
              <View style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Шалгалт эхлэх</Text>
                <Icon name="arrowRight" size={14} color={colors.text} />
              </View>
            </PressableScale>
          </GlassCard>
        </Reveal>
      ) : (
        <View style={styles.list}>
          {saved.exams.map((exam, index) => {
            const answered = Object.keys(exam.answers).length;
            const pct = exam.ids.length > 0 ? answered / exam.ids.length : 0;
            return (
              <Reveal key={exam.key} delay={60 + index * 45}>
                <GlassCard style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={2} style={styles.tag}>{exam.tag}</Text>
                      <Text style={styles.meta}>
                        {exam.mode === "exam" ? "Шалгалт" : "Сургалт"} · {exam.ids.length} сорилго · {answered} хариулсан
                      </Text>
                    </View>
                    <View style={[styles.modeTag, exam.mode === "exam" && styles.modeTagExam]}>
                      <Text style={[styles.modeText, exam.mode === "exam" && styles.modeTextExam]}>
                        {exam.mode === "exam" ? clock(exam.timeLeft) : clock(exam.elapsed)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressRow}>
                    <View style={{ flex: 1 }}>
                      <ProgressBar progress={pct} height={4} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(pct * 100)}%</Text>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.updated}>{relativeDay(exam.updatedAt)}</Text>
                    <View style={styles.actions}>
                      <PressableScale onPress={() => setPendingDelete(exam.key)} scaleTo={0.95}>
                        <View style={styles.deleteBtn}>
                          <Icon name="close" size={13} color={colors.rose} />
                          <Text style={styles.deleteText}>Устгах</Text>
                        </View>
                      </PressableScale>
                      <PressableScale
                        onPress={() => router.push({ pathname: "/quiz", params: { saved: exam.key } })}
                        scaleTo={0.96}
                      >
                        <View style={styles.resumeBtn}>
                          <Icon name="play" size={13} color={colors.text} strokeWidth={2.4} />
                          <Text style={styles.resumeText}>Үргэлжлүүлэх</Text>
                        </View>
                      </PressableScale>
                    </View>
                  </View>
                </GlassCard>
              </Reveal>
            );
          })}
        </View>
      )}

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Хадгалсан шалгалтыг устгах уу?"
        message={target ? `«${target.tag}» устаж, буцаах боломжгүй болно.` : "Энэ шалгалт устах болно."}
        confirmText="Устгах"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void saved.remove(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { fontFamily: fonts.body, fontSize: 12, color: colors.dim, marginTop: 30, textAlign: "center" },
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
  list: { gap: 12, marginTop: 18 },
  card: { padding: 15 },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tag: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 3 },
  modeTag: {
    minWidth: 56,
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  modeTagExam: { borderColor: "rgba(251,113,133,0.22)", backgroundColor: "rgba(251,113,133,0.08)" },
  modeText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted },
  modeTextExam: { color: colors.rose },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 13 },
  progressText: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.muted, width: 34, textAlign: "right" },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 13 },
  updated: { flex: 1, fontFamily: fonts.body, fontSize: 9, color: colors.dim },
  actions: { flexDirection: "row", alignItems: "center", gap: 7 },
  deleteBtn: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.22)",
    backgroundColor: "rgba(251,113,133,0.06)",
  },
  deleteText: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.rose },
  resumeBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  resumeText: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.text },
});
