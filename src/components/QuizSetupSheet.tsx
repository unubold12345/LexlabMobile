import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui";
import { colors, fonts, radii } from "@/lib/theme";
import type { QuizMode } from "@/lib/types";

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

function countOptions(total: number): number[] {
  const capped = Math.min(30, Math.max(0, total));
  if (capped === 0) return [];
  return Array.from(new Set([5, 10, 20, 30].filter((n) => n < capped).concat(capped))).sort((a, b) => a - b);
}

export function QuizSetupSheet({
  visible,
  main,
  sub,
  total,
  initialMode = "practice",
  onClose,
  onStart,
}: {
  visible: boolean;
  main: string;
  sub: string;
  total: number;
  initialMode?: QuizMode;
  onClose: () => void;
  onStart: (mode: QuizMode, count: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const options = useMemo(() => countOptions(total), [total]);
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [count, setCount] = useState(Math.min(10, Math.max(1, total)));

  useEffect(() => {
    if (!visible) return;
    setMode(initialMode);
    setCount(Math.min(10, Math.max(1, total)));
  }, [visible, initialMode, total]);

  const title = sub ? sub : main === "all" ? "Бүх сэдэв" : shortName(main);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Хаах" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>ДАСГАЛ ЭХЛҮҮЛЭХ</Text>
              <Text numberOfLines={2} style={styles.title}>
                {title}
              </Text>
              <Text style={styles.meta}>
                {total.toLocaleString()} асуулт · {mode === "exam" ? "1 мин / асуулт" : "шууд хариу шалгана"}
              </Text>
            </View>
            <PressableScale onPress={onClose} scaleTo={0.9}>
              <View style={styles.close}>
                <Icon name="close" size={15} color={colors.muted} />
              </View>
            </PressableScale>
          </View>

          <Text style={styles.label}>ГОРИМ</Text>
          <View style={styles.modeRow}>
            <ModeCard
              active={mode === "practice"}
              icon="book"
              title="Дасгал"
              caption="Хариулт шалгах"
              onPress={() => setMode("practice")}
            />
            <ModeCard
              active={mode === "exam"}
              icon="clock"
              title="Шалгалт"
              caption="Хугацаатай"
              onPress={() => setMode("exam")}
            />
          </View>

          <Text style={styles.label}>АСУУЛТЫН ТОО</Text>
          <View style={styles.countRow}>
            {options.map((n) => (
              <PressableScale key={n} onPress={() => setCount(n)} scaleTo={0.95} style={{ flex: 1 }}>
                <View style={[styles.countBtn, count === n && styles.countActive]}>
                  <Text style={[styles.countText, count === n && styles.countTextActive]}>{n}</Text>
                </View>
              </PressableScale>
            ))}
          </View>

          <PressableScale onPress={() => onStart(mode, count)} scaleTo={0.97}>
            <LinearGradient
              colors={["#4F5763", "#30353D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.start}
            >
              <Icon name="play" size={16} color={colors.white} strokeWidth={2.4} />
              <Text style={styles.startText}>{count} асуултаар эхлэх</Text>
              <Icon name="arrowRight" size={16} color={colors.white} />
            </LinearGradient>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

function ModeCard({
  active,
  icon,
  title,
  caption,
  onPress,
}: {
  active: boolean;
  icon: "book" | "clock";
  title: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.97} style={{ flex: 1 }}>
      <View style={[styles.modeCard, active && styles.modeCardActive]}>
        <View style={[styles.modeIcon, active && styles.modeIconActive]}>
          <Icon name={icon} size={16} color={active ? colors.white : colors.dim} strokeWidth={2.1} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>{title}</Text>
          <Text style={styles.modeCaption}>{caption}</Text>
        </View>
        <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(3,3,8,0.76)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#101018",
    paddingHorizontal: 20,
    paddingTop: 9,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -12 },
    elevation: 22,
  },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)" },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 18 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.8, color: colors.lilac },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.text, marginTop: 5 },
  meta: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 5 },
  close: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSoft },
  label: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.5, color: colors.dim, marginTop: 22, marginBottom: 9 },
  modeRow: { flexDirection: "row", gap: 9 },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  modeCardActive: { borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(255,255,255,0.09)" },
  modeIcon: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  modeIconActive: { backgroundColor: "rgba(255,255,255,0.14)" },
  modeTitle: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.muted },
  modeTitleActive: { color: colors.text },
  modeCaption: { fontFamily: fonts.body, fontSize: 8.8, color: colors.dim, marginTop: 2 },
  radio: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.lilac },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lilac },
  countRow: { flexDirection: "row", gap: 8 },
  countBtn: {
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  countActive: { borderColor: "rgba(255,255,255,0.24)", backgroundColor: "rgba(255,255,255,0.10)" },
  countText: { fontFamily: fonts.display, fontSize: 16, color: colors.muted },
  countTextActive: { color: colors.white },
  start: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 22,
  },
  startText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.white },
});
