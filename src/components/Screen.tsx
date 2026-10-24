import React from "react";
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Aurora } from "@/components/Aurora";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/lib/theme";

export function Screen({
  children,
  scroll = true,
  contentStyle,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { gutter, maxContentWidth } = useResponsive();
  if (!scroll) {
    return (
      <View style={styles.root}>
        <Aurora />
        <View style={[styles.column, { maxWidth: maxContentWidth }]}>
          <View style={{ flex: 1, paddingTop: insets.top + 6 }}>{children}</View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <Aurora />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingTop: insets.top + 6,
            paddingBottom: insets.bottom + 132,
          },
          contentStyle,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.muted} colors={[colors.lilac]} />
          ) : undefined
        }
      >
        <View style={[styles.scrollColumn, { maxWidth: maxContentWidth, paddingHorizontal: gutter }]}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: "100%", alignSelf: "center" },
  scrollColumn: { width: "100%", alignSelf: "center" },
});
