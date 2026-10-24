import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Icon, IconName } from "@/components/Icon";
import { useResponsive } from "@/lib/responsive";
import { colors, fonts, radii } from "@/lib/theme";
import { tap } from "@/lib/haptics";

const TABS: { name: string; icon: IconName; label: string }[] = [
  { name: "index", icon: "home", label: "Нүүр" },
  { name: "subjects", icon: "grid", label: "Сэдэв" },
  { name: "practice", icon: "target", label: "Дасгал" },
  { name: "profile", icon: "user", label: "Профайл" },
];

export function FloatingTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const activeName = state.routes[state.index]?.name;
  const { isTablet, isLargeTablet } = useResponsive();
  const barMaxWidth = isLargeTablet ? 720 : isTablet ? 640 : 9999;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: insets.bottom + (isTablet ? 16 : 10),
          paddingHorizontal: isTablet ? 24 : 16,
        },
      ]}
    >
      <View style={[styles.shadow, { width: "100%", maxWidth: barMaxWidth }]}>
        <BlurView intensity={60} tint="dark" style={styles.bar}>
          <View style={styles.barTint} />
          <LinearGradient
            colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.topEdge}
          />
          <View style={[styles.row, isTablet && styles.rowTablet]}>
            {TABS.map((tab) => {
              const route = state.routes.find((r) => r.name === tab.name);
              if (!route) return null;
              const isFocused = activeName === tab.name;
              return (
                <Pressable
                  key={tab.name}
                  onPress={() => {
                    tap();
                    const event = emitter.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                      navigateToTab(route.key);
                    }
                  }}
                  onLongPress={() =>
                    emitter.emit({ type: "tabLongPress", target: route.key })
                  }
                  style={styles.tab}
                >
                  <View style={[styles.tabInner, isTablet && styles.tabInnerTablet]}>
                    {isFocused ? (
                      <Animated.View
                        entering={FadeIn.duration(160)}
                        exiting={FadeOut.duration(120)}
                        style={styles.activePill}
                      >
                        <View style={styles.activeSheen} />
                      </Animated.View>
                    ) : null}
                    <Icon
                      name={tab.icon}
                      size={isTablet ? 23 : 21}
                      color={isFocused ? colors.text : colors.dim}
                      strokeWidth={isFocused ? 2.1 : 1.7}
                    />
                    <Text
                      style={[
                        styles.label,
                        isTablet && styles.labelTablet,
                        isFocused && styles.labelActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  shadow: {
    borderRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  bar: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  barTint: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(9,9,15,0.88)" },
  topEdge: { position: "absolute", top: 0, left: 24, right: 24, height: 1, opacity: 0.7 },
  row: { flexDirection: "row", height: 66, alignItems: "center", paddingHorizontal: 6 },
  rowTablet: { height: 74, paddingHorizontal: 10 },
  tab: { flex: 1, height: 54, alignItems: "center", justifyContent: "center" },
  tabInner: { alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill },
  tabInnerTablet: { gap: 5, paddingHorizontal: 20, paddingVertical: 9 },
  activePill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.085)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    overflow: "hidden",
  },
  activeSheen: {
    position: "absolute",
    top: 0,
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 9.5, letterSpacing: 0.2, color: colors.dim },
  labelTablet: { fontSize: 10.5 },
  labelActive: { color: colors.text, fontFamily: fonts.bodyBold },
});
