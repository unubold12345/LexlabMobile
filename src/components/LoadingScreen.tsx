import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Aurora } from "@/components/Aurora";
import { LogoMark } from "@/components/LogoMark";
import { colors, fonts } from "@/lib/theme";

const STATUS_LINES = [
  "Асуултын санг бэлтгэж байна",
  "Таны явцыг сэргээж байна",
  "Өнөөдрийн төлөвлөгөөг тохируулж байна",
];

export function LoadingScreen({ ready = true, onFinish }: { ready?: boolean; onFinish: () => void }) {
  const [minElapsed, setMinElapsed] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const spin = useSharedValue(0);
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const finished = useRef(false);

  useEffect(() => {
    const min = setTimeout(() => setMinElapsed(true), 2500);
    const cycle = setInterval(() => setStatusIndex((i) => (i + 1) % STATUS_LINES.length), 850);
    return () => {
      clearTimeout(min);
      clearInterval(cycle);
    };
  }, []);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.4)) });
    spin.value = withRepeat(withTiming(360, { duration: 7000, easing: Easing.linear }), -1, false);
  }, [logoOpacity, logoScale, spin]);

  useEffect(() => {
    progress.value = withTiming(0.86, { duration: 2100, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  useEffect(() => {
    if (!minElapsed || !ready || finished.current) return;
    finished.current = true;
    progress.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 420, easing: Easing.in(Easing.cubic) }, (ok) => {
        if (ok) runOnJS(onFinish)();
      });
      scale.value = withTiming(1.04, { duration: 420, easing: Easing.in(Easing.cubic) });
    }, 480);
    return () => clearTimeout(t);
  }, [minElapsed, ready, progress, opacity, scale, onFinish]);

  const screenStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const innerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, screenStyle]}>
      <Aurora intense />
      <Animated.View style={[styles.content, innerStyle]}>
        <View style={styles.markWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.ring, ringStyle]}>
            <Svg width={168} height={168}>
              <Circle
                cx={84}
                cy={84}
                r={72}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1}
                strokeDasharray="26 26"
                fill="none"
              />
              <Circle cx={84} cy={8} r={3} fill="#D4D7DC" />
            </Svg>
          </Animated.View>
          <View style={styles.markGlow} />
          <Animated.View style={logoStyle}>
            <LogoMark size={96} />
          </Animated.View>
        </View>

        <Animated.Text entering={FadeInDown.delay(220).duration(600)} style={styles.wordmark}>
          LEXLAB
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(340).duration(600)} style={styles.tagline}>
          Хуулийн шалгалтын лаборатори
        </Animated.Text>

        <View style={styles.bottom}>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, barStyle]}>
              <View style={styles.fillGlow} />
            </Animated.View>
          </View>
          <Animated.Text key={statusIndex} entering={FadeIn.duration(350)} exiting={FadeOut.duration(180)} style={styles.status}>
            {STATUS_LINES[statusIndex]}
          </Animated.Text>
        </View>
      </Animated.View>
      <View style={styles.footRow}>
        <Text style={styles.footText}>LEXLAB · 2026</Text>
        <Text style={styles.footText}>v1.0</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg, zIndex: 100, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingHorizontal: 36 },
  markWrap: { width: 168, height: 168, alignItems: "center", justifyContent: "center" },
  ring: { alignItems: "center", justifyContent: "center" },
  markGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.10)",
    ...Platform.select({ android: { elevation: 0 }, default: {} }),
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: 8,
    color: colors.text,
    marginTop: 24,
    marginLeft: 8,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.muted,
    letterSpacing: 1.2,
    marginTop: 8,
  },
  bottom: { position: "absolute", bottom: 74, left: 36, right: 36 },
  track: {
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  fill: { height: 4, borderRadius: 4, backgroundColor: "#B6BCC5", overflow: "hidden" },
  fillGlow: { flex: 1, backgroundColor: "#F4F4F5", opacity: 0.25 },
  status: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.dim,
    marginTop: 14,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  footRow: {
    position: "absolute",
    bottom: 34,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footText: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,0.28)" },
});
