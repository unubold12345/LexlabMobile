import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Icon } from "@/components/Icon";
import { colors, fonts, radii } from "@/lib/theme";
import { tap } from "@/lib/haptics";

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

const TONES: Record<OptionState, { border: string; bg: string; text: string; badgeBg: string; badgeText: string }> = {
  idle: {
    border: colors.border,
    bg: "rgba(255,255,255,0.035)",
    text: colors.text,
    badgeBg: "rgba(255,255,255,0.06)",
    badgeText: colors.muted,
  },
  selected: {
    border: "rgba(255,255,255,0.55)",
    bg: "rgba(255,255,255,0.09)",
    text: colors.text,
    badgeBg: "rgba(255,255,255,0.16)",
    badgeText: colors.text,
  },
  correct: {
    border: "rgba(52,211,153,0.8)",
    bg: "rgba(16,185,129,0.13)",
    text: "#D1FAE5",
    badgeBg: "rgba(16,185,129,0.28)",
    badgeText: "#A7F3D0",
  },
  wrong: {
    border: "rgba(251,113,133,0.8)",
    bg: "rgba(225,29,72,0.13)",
    text: "#FFE4E6",
    badgeBg: "rgba(225,29,72,0.28)",
    badgeText: "#FECDD3",
  },
  dimmed: {
    border: "rgba(255,255,255,0.04)",
    bg: "rgba(255,255,255,0.02)",
    text: "rgba(246,245,251,0.35)",
    badgeBg: "rgba(255,255,255,0.03)",
    badgeText: "rgba(255,255,255,0.25)",
  },
};

export function QuizOption({
  letter,
  text,
  state,
  disabled,
  showLetter = true,
  onPress,
}: {
  letter: string;
  text: string;
  state: OptionState;
  disabled?: boolean;
  showLetter?: boolean;
  onPress: () => void;
}) {
  const tone = TONES[state];
  const border = useSharedValue(tone.border);
  const bg = useSharedValue(tone.bg);
  const scale = useSharedValue(1);

  useEffect(() => {
    border.value = withTiming(tone.border, { duration: 220, easing: Easing.out(Easing.quad) });
    bg.value = withTiming(tone.bg, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [tone.border, tone.bg, border, bg]);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: border.value,
    backgroundColor: bg.value,
    transform: [{ scale: scale.value }],
  }));

  const showIcon = state === "correct" || state === "wrong";

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: !!disabled, selected: state === "selected" }}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 20, stiffness: 340 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 260 });
      }}
      onPress={() => {
        tap();
        onPress();
      }}
    >
      <Animated.View style={[styles.row, boxStyle]}>
        {showLetter ? (
          <View style={[styles.badge, { backgroundColor: tone.badgeBg }]}>
            <Text style={[styles.letter, { color: tone.badgeText }]}>{letter}</Text>
          </View>
        ) : null}
        <Text style={[styles.text, { color: tone.text }]}>{text}</Text>
        {showIcon ? (
          <View style={styles.checkWrap}>
            <Icon name={state === "correct" ? "check" : "x"} size={17} color={state === "correct" ? colors.emerald : colors.rose} strokeWidth={2.4} />
          </View>
        ) : (
          <View style={styles.dot} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: radii.md,
    borderWidth: 1.2,
    minHeight: 60,
  },
  badge: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  letter: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  text: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 21 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.14)", marginRight: 4 },
  checkWrap: { width: 22, alignItems: "flex-end" },
});
