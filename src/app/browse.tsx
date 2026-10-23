import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScrollViewInstance } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { QuizOption, OptionState } from "@/components/QuizOption";
import { SubjectPickerSheet } from "@/components/SubjectPickerSheet";
import { PressableScale, Tag } from "@/components/ui";
import { useBank } from "@/lib/bank";
import { useProgress } from "@/lib/progress";
import { colors, fonts, radii } from "@/lib/theme";

const LETTERS = ["A", "B", "C", "D", "E"];

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

function difficultyLabel(value?: string): string {
  const key = (value || "").trim().toLowerCase();
  if (key === "easy") return "Хялбар";
  if (key === "medium") return "Дунд";
  if (key === "hard") return "Хүнд";
  return value || "Дунд";
}

export default function Browse() {
  const params = useLocalSearchParams<{ main?: string; sub?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bank = useBank();
  const progress = useProgress();

  const leave = () => {
    if (Platform.OS !== "web" && router.canGoBack()) router.back();
    else router.replace("/subjects");
  };

  const paramMain = typeof params.main === "string" ? params.main : "all";
  const paramSub = typeof params.sub === "string" ? params.sub : "";

  const [scope, setScope] = useState({ main: paramMain, sub: paramSub });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    setScope({ main: paramMain, sub: paramSub });
  }, [paramMain, paramSub]);

  const list = useMemo(() => {
    if (scope.main === "all") return bank.questions;
    return bank.byMain(scope.main, scope.sub || undefined);
  }, [bank, scope]);

  const safeIndex = Math.min(index, Math.max(0, list.length - 1));
  const current = list[safeIndex];
  const isLast = safeIndex + 1 >= list.length;
  const bookmarked = current ? progress.bookmarks.includes(current.id) : false;
  const title = scope.sub
    ? shortName(scope.sub)
    : scope.main === "all"
      ? "Бүх сэдэв"
      : shortName(scope.main);

  const chooseScope = (nextMain: string, nextSub: string) => {
    setScope({ main: nextMain, sub: nextSub });
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setPickerOpen(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [safeIndex]);

  const go = (next: number) => {
    setIndex(Math.max(0, Math.min(list.length - 1, next)));
    setSelected(null);
    setRevealed(false);
  };

  if (!current) {
    return (
      <View style={[styles.root, styles.emptyRoot]}>
        <Icon name="book" size={32} color={colors.dim} />
        <Text style={styles.emptyTitle}>Асуулт олдсонгүй</Text>
        <Text style={styles.emptyText}>Энэ сэдвээр асуулт байхгүй байна. Өөр сэдэв сонгоно уу.</Text>
        <PressableScale onPress={leave} style={{ marginTop: 14 }}>
          <View style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Буцах</Text>
          </View>
        </PressableScale>
      </View>
    );
  }

  const stateFor = (i: number): OptionState => {
    if (revealed) {
      if (i === current.answer) return "correct";
      if (i === selected) return "wrong";
      return "dimmed";
    }
    return selected === i ? "selected" : "idle";
  };

  const pick = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={leave} scaleTo={0.92} accessibilityLabel="Буцах">
          <View style={styles.iconBtn}>
            <Icon name="arrowLeft" size={18} color={colors.muted} />
          </View>
        </PressableScale>
        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.headerScope}>
            {title}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <PressableScale onPress={() => setPickerOpen(true)} scaleTo={0.9} accessibilityLabel="Сэдэв солих">
            <View style={styles.iconBtn}>
              <Icon name="filter" size={16} color={colors.muted} />
            </View>
          </PressableScale>
          <PressableScale onPress={() => progress.toggleBookmark(current.id)} scaleTo={0.9} accessibilityLabel="Хадгалах">
            <View style={[styles.iconBtn, bookmarked && styles.iconBtnActive]}>
              <Icon name="bookmark" size={17} color={bookmarked ? colors.lilac : colors.muted} />
            </View>
          </PressableScale>
        </View>
      </View>

      <View style={styles.navBar}>
        <PressableScale
          onPress={() => go(safeIndex - 1)}
          disabled={safeIndex === 0}
          scaleTo={0.96}
          style={[styles.navButton, safeIndex === 0 && styles.navDisabled]}
          contentStyle={styles.navContent}
        >
          <Icon name="chevronLeft" size={14} color={safeIndex === 0 ? colors.dim : colors.muted} />
          <Text style={[styles.navText, safeIndex === 0 && styles.navTextDisabled]}>Өмнөх</Text>
        </PressableScale>
        <View style={styles.navCountWrap}>
          <Text style={styles.navCount}>
            {safeIndex + 1} <Text style={styles.navCountDim}>/ {list.length}</Text>
          </Text>
        </View>
        <PressableScale
          onPress={() => go(safeIndex + 1)}
          disabled={isLast}
          scaleTo={0.96}
          style={[styles.navButton, isLast && styles.navDisabled]}
          contentStyle={styles.navContent}
        >
          <Text style={[styles.navText, isLast && styles.navTextDisabled]}>Дараах</Text>
          <Icon name="chevronRight" size={14} color={isLast ? colors.dim : colors.muted} />
        </PressableScale>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 34 }]}
      >
        <Animated.View key={`${current.id}-${safeIndex}`} entering={FadeInDown.duration(340)} style={styles.card}>
          <View style={styles.questionHead}>
            <Text style={styles.questionNumber}>{safeIndex + 1}.</Text>
            <Text style={styles.question}>{current.question}</Text>
          </View>

          <View style={styles.metaRow}>
            <Tag text={current.subCategory} tint={colors.lilac} />
            <Text style={styles.difficulty}>{difficultyLabel(current.difficulty)}</Text>
          </View>

          <View style={styles.cardActions}>
            <PressableScale onPress={() => setRevealed((value) => !value)} scaleTo={0.96}>
              <View style={styles.revealButton}>
                <Icon name="eye" size={13} color={colors.muted} />
                <Text style={styles.revealText}>{revealed ? "Хариу нуух" : "Зөв хариулт харах"}</Text>
              </View>
            </PressableScale>
            {!revealed ? (
              <Text style={styles.pickHint}>Сонголт дээр дарж шалгана</Text>
            ) : null}
          </View>

          <View style={styles.options}>
            {current.options.map((option, i) => (
              <QuizOption
                key={`${current.id}-${i}`}
                letter={LETTERS[i] ?? String(i + 1)}
                text={option}
                state={stateFor(i)}
                disabled={revealed}
                showLetter={false}
                onPress={() => pick(i)}
              />
            ))}
          </View>

          {revealed ? (
            <Animated.View entering={FadeIn.duration(280)} style={styles.answerCard}>
              <View style={styles.answerHead}>
                <View style={styles.answerIcon}>
                  <Icon name="check" size={14} color={colors.emerald} strokeWidth={2.3} />
                </View>
                <Text style={styles.answerTitle}>Зөв хариу</Text>
              </View>
              <Text style={styles.answerText}>{current.options[current.answer]}</Text>
              {current.explanation?.trim() ? (
                <Text style={styles.explanation}>{current.explanation}</Text>
              ) : (
                <Text style={styles.explanation}>Энэ асуултын тайлбар удахгүй нэмэгдэнэ.</Text>
              )}
              {current.lawRef ? (
                <View style={styles.lawRef}>
                  <Icon name="book" size={11} color={colors.dim} />
                  <Text style={styles.lawRefText}>{current.lawRef}</Text>
                </View>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <SubjectPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={chooseScope}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  emptyRoot: { alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.text, marginTop: 14 },
  emptyText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 6, textAlign: "center" },
  emptyBtn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  emptyBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 9 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerScope: { maxWidth: 200, fontFamily: fonts.displayMedium, fontSize: 13, color: colors.text },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSoft, alignItems: "center", justifyContent: "center" },
  iconBtnActive: { borderColor: "rgba(255,255,255,0.24)", backgroundColor: "rgba(255,255,255,0.09)" },
  navBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 14, padding: 5, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.035)" },
  navButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", height: 36, paddingHorizontal: 10, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.045)" },
  navContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, width: "100%" },
  navDisabled: { opacity: 0.4 },
  navText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted },
  navTextDisabled: { color: colors.dim },
  navCountWrap: { width: 84, alignItems: "center" },
  navCount: { fontFamily: fonts.display, fontSize: 13, color: colors.text },
  navCountDim: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.dim },
  scroll: { paddingHorizontal: 20, paddingTop: 14 },
  card: { borderRadius: 22, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.032)", padding: 17 },
  questionHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  questionNumber: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.dim, marginTop: 2 },
  question: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 23, color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 14 },
  difficulty: { fontFamily: fonts.body, fontSize: 10, color: colors.dim, textTransform: "capitalize" },
  cardActions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 16 },
  revealButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.035)" },
  revealText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted },
  pickHint: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
  options: { gap: 9, marginTop: 12 },
  answerCard: { marginTop: 16, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(16,185,129,0.08)" },
  answerHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  answerIcon: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(52,211,153,0.16)" },
  answerTitle: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.1, color: colors.emerald },
  answerText: { fontFamily: fonts.bodySemi, fontSize: 12.5, lineHeight: 18, color: colors.text, marginTop: 9 },
  explanation: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 18, color: colors.muted, marginTop: 8 },
  lawRef: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  lawRefText: { flex: 1, fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
});
