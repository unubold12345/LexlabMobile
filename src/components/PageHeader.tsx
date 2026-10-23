import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui";
import { colors } from "@/lib/theme";

export function PageHeader({ backTo }: { backTo?: string }) {
  const router = useRouter();

  const goBack = () => {
    if (backTo) router.replace(backTo);
    else if (Platform.OS !== "web" && router.canGoBack()) router.back();
    else router.replace("/subjects");
  };

  return (
    <View style={styles.row}>
      <PressableScale onPress={goBack} scaleTo={0.92} accessibilityLabel="Буцах">
        <View style={styles.back}>
          <Icon name="arrowLeft" size={18} color={colors.muted} />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
