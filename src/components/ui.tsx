import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radii } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import { Icon, IconName } from "@/components/Icon";

export function PressableScale({
  children,
  onPress,
  style,
  contentStyle,
  disabled,
  haptic = true,
  scaleTo = 0.965,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  scaleTo?: number;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "button" : undefined}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 260 });
      }}
      onPress={() => {
        if (disabled) return;
        if (haptic) tap();
        onPress?.();
      }}
      style={style}
    >
      <Animated.View style={[animated, contentStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export function GlassCard({
  children,
  style,
  padded = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <View style={[styles.glass, padded && { padding: 18 }, style]}>
      <View pointerEvents="none" style={styles.sheen} />
      {children}
    </View>
  );
}

export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(560)} style={style}>
      {children}
    </Animated.View>
  );
}

export function SectionHeader({
  title,
  caption,
  action,
  onAction,
}: {
  title: string;
  caption?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {action ? (
        <PressableScale onPress={onAction} scaleTo={0.94}>
          <View style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>{action}</Text>
            <Icon name="chevronRight" size={14} color={colors.lilac} />
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.95}>
      {active ? (
        <View style={[styles.chip, styles.chipActive]}>
          {icon ? <Icon name={icon} size={14} color={colors.text} strokeWidth={2} /> : null}
          <Text style={styles.chipTextActive}>{label}</Text>
        </View>
      ) : (
        <View style={styles.chip}>
          {icon ? <Icon name={icon} size={14} color={colors.muted} /> : null}
          <Text style={styles.chipText}>{label}</Text>
        </View>
      )}
    </PressableScale>
  );
}

export function ProgressBar({
  progress,
  height = 6,
  from = "#7C8490",
  to = "#D8DBDF",
  track = "rgba(255,255,255,0.08)",
}: {
  progress: number;
  height?: number;
  from?: string;
  to?: string;
  track?: string;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={[styles.track, { height, borderRadius: height }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: track, borderRadius: height }]} />
      <Animated.View style={[{ height, borderRadius: height, overflow: "hidden" }, fill]}>
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function CountUp({
  value,
  suffix = "",
  style,
  duration = 800,
}: {
  value: number;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    fromRef.current = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);
  return (
    <Text style={style}>
      {display}
      {suffix}
    </Text>
  );
}

export function StatTile({
  icon,
  value,
  label,
  tint = colors.lilac,
  delay = 0,
}: {
  icon: IconName;
  value: string;
  label: string;
  tint?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} style={{ flex: 1 }}>
      <GlassCard style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: `${tint}18`, borderColor: `${tint}30` }]}>
          <Icon name={icon} size={15} color={tint} strokeWidth={1.9} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </GlassCard>
    </Reveal>
  );
}

export function Tag({ text, tint = colors.lilac }: { text: string; tint?: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: `${tint}16`, borderColor: `${tint}2e` }]}>
      <Text style={[styles.tagText, { color: tint }]}>{text}</Text>
    </View>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Reveal>
      <Text style={styles.screenKicker}>LEXLAB</Text>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </Reveal>
  );
}

export function EmptyNote({ text }: { text: string }) {
  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <GlassCard style={styles.empty}>
        <Icon name="sparkles" size={20} color={colors.dim} />
        <Text style={styles.emptyText}>{text}</Text>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionCaption: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.dim,
    marginTop: 3,
  },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 2 },
  sectionActionText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.lilac },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  chipActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.16)",
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  chipTextActive: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white },
  track: { width: "100%", overflow: "hidden" },
  statCard: { padding: 12, paddingBottom: 13, gap: 7 },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontFamily: fonts.display, fontSize: 21, color: colors.text, letterSpacing: -0.4 },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim },
  tag: { alignSelf: "flex-start", borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  screenKicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2.6,
    color: colors.lilac,
    opacity: 0.8,
    marginBottom: 8,
  },
  screenTitle: { fontFamily: fonts.display, fontSize: 30, color: colors.text, letterSpacing: -0.8 },
  screenSubtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, marginTop: 6, lineHeight: 20 },
  empty: { padding: 18, flexDirection: "row", alignItems: "center", gap: 10 },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, flex: 1 },
});
