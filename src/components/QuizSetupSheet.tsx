import React, { useEffect, useRef, useState } from "react";
import { Modal, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui";
import { useResponsive } from "@/lib/responsive";
import { colors, fonts, radii } from "@/lib/theme";
import type { QuizMode } from "@/lib/types";

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

const THUMB_SIZE = 22;

function CountSlider({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const maxRef = useRef(max);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    maxRef.current = max;
  }, [max]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const changeFromX = (x: number) => {
    const track = widthRef.current;
    if (track <= 0) return;
    const usable = Math.max(0, track - THUMB_SIZE);
    const ratio = Math.max(0, Math.min(1, (x - THUMB_SIZE / 2) / Math.max(1, usable)));
    onChangeRef.current(Math.round(ratio * maxRef.current));
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => changeFromX(event.nativeEvent.locationX),
      onPanResponderMove: (event) => changeFromX(event.nativeEvent.locationX),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const usable = Math.max(0, width - THUMB_SIZE);

  return (
    <>
      <View
        style={styles.sliderHit}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          widthRef.current = nextWidth;
          setWidth(nextWidth);
        }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Асуултын тоо"
        accessibilityValue={{ min: 0, max, now: value }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          const next = event.nativeEvent.actionName === "increment" ? value + 1 : value - 1;
          onChange(Math.max(0, Math.min(max, next)));
        }}
        {...responder.panHandlers}
      >
        <View pointerEvents="none" style={styles.sliderRail} />
        <View pointerEvents="none" style={[styles.sliderFill, { width: ratio * usable }]} />
        <View pointerEvents="none" style={[styles.sliderThumb, { left: ratio * usable }]} />
      </View>
      <View style={styles.sliderScale}>
        <Text style={styles.sliderScaleText}>0</Text>
        <Text style={styles.sliderScaleText}>{max.toLocaleString()}</Text>
      </View>
    </>
  );
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
  const { isTablet } = useResponsive();
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [count, setCount] = useState(Math.min(10, Math.max(0, total)));

  useEffect(() => {
    if (!visible) return;
    setMode(initialMode);
    setCount(Math.min(10, Math.max(0, total)));
  }, [visible, initialMode, total]);

  const title = sub ? sub : main === "all" ? "Бүх сэдэв" : shortName(main);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Хаах" />
        <View
          style={[
            styles.sheet,
            isTablet && styles.sheetTablet,
            {
              paddingBottom: isTablet ? 24 : insets.bottom + 18,
              marginBottom: isTablet ? Math.max(24, insets.bottom + 10) : 0,
              maxWidth: isTablet ? 640 : undefined,
            },
          ]}
        >
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

          <View style={styles.countHeader}>
            <Text style={styles.labelInline}>АСУУЛТЫН ТОО</Text>
            <Text style={styles.countValue}>
              {count.toLocaleString()} <Text style={styles.countValueDim}>/ {total.toLocaleString()}</Text>
            </Text>
          </View>
          <CountSlider value={count} max={total} onChange={setCount} />

          <PressableScale
            onPress={() => onStart(mode, count)}
            disabled={count <= 0}
            scaleTo={0.97}
            style={count <= 0 ? styles.startDisabled : undefined}
          >
            <LinearGradient
              colors={["#4F5763", "#30353D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.start}
            >
              <Icon name="play" size={16} color={colors.white} strokeWidth={2.4} />
              <Text style={styles.startText}>
                {count > 0 ? `${count.toLocaleString()} асуултаар эхлэх` : "Асуултын тоо сонгоно уу"}
              </Text>
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
  sheetTablet: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 26,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  countHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 22, marginBottom: 2 },
  labelInline: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.5, color: colors.dim },
  countValue: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  countValueDim: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.dim },
  sliderHit: { height: 44, justifyContent: "center", marginTop: 2 },
  sliderRail: { position: "absolute", left: THUMB_SIZE / 2, right: THUMB_SIZE / 2, top: 19.5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.10)" },
  sliderFill: { position: "absolute", left: THUMB_SIZE / 2, top: 19.5, height: 5, borderRadius: 3, backgroundColor: colors.lilac },
  sliderThumb: { position: "absolute", top: 11, width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, borderWidth: 3, borderColor: "#101018", backgroundColor: colors.text },
  sliderScale: { flexDirection: "row", justifyContent: "space-between", marginTop: -2 },
  sliderScaleText: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
  startDisabled: { opacity: 0.45 },
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
