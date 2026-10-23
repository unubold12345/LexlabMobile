import React from "react";
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Aurora } from "@/components/Aurora";
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
  if (!scroll) {
    return (
      <View style={styles.root}>
        <Aurora />
        <View style={{ flex: 1, paddingTop: insets.top + 6 }}>{children}</View>
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
            paddingHorizontal: 20,
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
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
