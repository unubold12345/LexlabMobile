import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export function LogoMark({ size = 44, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <View
      style={[
        { width: size, height: size },
        glow && Platform.OS !== "web"
          ? {
              shadowColor: "#FFFFFF",
              shadowOpacity: 0.18,
              shadowRadius: size * 0.35,
              shadowOffset: { width: 0, height: 0 },
              elevation: 10,
            }
          : null,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="lexlab-mark" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F4F4F5" />
            <Stop offset="0.55" stopColor="#C4C8CF" />
            <Stop offset="1" stopColor="#858B95" />
          </LinearGradient>
        </Defs>
        <Rect x="2.5" y="2.5" width="59" height="59" rx="19" fill="#FFFFFF" fillOpacity={0.06} stroke="url(#lexlab-mark)" strokeWidth="1.5" />
        <Path d="M23 17.5v27h19" fill="none" stroke="url(#lexlab-mark)" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="m31 17.5 7.4 7.4" fill="none" stroke="url(#lexlab-mark)" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        <Circle cx="46" cy="45.5" r="3.2" fill="url(#lexlab-mark)" />
      </Svg>
    </View>
  );
}

export function LogoLockup({ size = 28, color = "#F6F5FB" }: { size?: number; color?: string }) {
  return (
    <View style={styles.lockup}>
      <LogoMark size={size} glow={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { flexDirection: "row", alignItems: "center" },
});
