import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { colors } from "@/lib/theme";

export function Aurora({ intense = false }: { intense?: boolean }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]}>
      <LinearGradient
        colors={intense ? ["#14161A", "#0A0B0E"] : ["#101216", colors.bg]}
        locations={[0, 0.7]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="ledger-dots" width={26} height={26} patternUnits="userSpaceOnUse">
            <Circle cx={1} cy={1} r={0.9} fill="#FFFFFF" opacity={0.055} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#ledger-dots)" />
      </Svg>

      <View style={[styles.glow, intense && styles.glowIntense]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.075)", "rgba(255,255,255,0.024)", "rgba(255,255,255,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.22)"]}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    backgroundColor: colors.bg,
  },
  glow: {
    position: "absolute",
    top: -230,
    alignSelf: "center",
    width: 620,
    height: 430,
    borderRadius: 310,
    overflow: "hidden",
    opacity: 0.8,
  },
  glowIntense: {
    opacity: 1,
    top: -200,
    width: 700,
    height: 520,
    borderRadius: 350,
  },
});
