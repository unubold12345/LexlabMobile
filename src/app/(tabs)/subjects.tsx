import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/Screen";
import { Icon, IconName } from "@/components/Icon";
import { PressableScale, Reveal } from "@/components/ui";
import { colors, fonts } from "@/lib/theme";

const MODES: {
  key: string;
  route: "/browse" | "/drill" | "/plan";
  icon: IconName;
  title: string;
  desc: string;
}[] = [
  {
    key: "read",
    route: "/browse",
    icon: "eye",
    title: "Унших",
    desc: "Асуултыг нэг нэгээр нь тайлбартай уншина",
  },
  {
    key: "drill",
    route: "/drill",
    icon: "play",
    title: "Дасгал",
    desc: "Сэдэв сонгоод тестээр өөрийгөө шалгана",
  },
  {
    key: "plan",
    route: "/plan",
    icon: "calendar",
    title: "Төлөвлөгөө",
    desc: "Өдрийн зорилтоо товлож, дарааллаар гүйцэтгэнэ",
  },
];

export default function Subjects() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen scroll={false}>
      <View style={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        <View style={styles.grid}>
          {MODES.map((mode, i) => (
            <Reveal key={mode.key} delay={60 + i * 70} style={styles.tileWrap}>
              <PressableScale
                onPress={() => router.push(mode.route)}
                scaleTo={0.97}
                accessibilityLabel={mode.title}
                style={styles.tilePress}
                contentStyle={styles.tilePress}
              >
                <View style={styles.tile}>
                  <View style={styles.iconWrap}>
                    <Icon name={mode.icon} size={28} color={colors.lilac} strokeWidth={1.9} />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.tileTitle}>{mode.title}</Text>
                    <Text style={styles.tileDesc}>{mode.desc}</Text>
                  </View>
                  <View style={styles.arrow}>
                    <Icon name="arrowRight" size={16} color={colors.dim} />
                  </View>
                </View>
              </PressableScale>
            </Reveal>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  grid: {
    flex: 1,
    gap: 12,
    marginTop: 20,
  },
  tileWrap: {
    flex: 1,
    minHeight: 124,
  },
  tilePress: {
    flex: 1,
  },
  tile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    backgroundColor: "rgba(255,255,255,0.042)",
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  textWrap: {
    flex: 1,
  },
  tileTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
  },
  tileDesc: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.dim,
    marginTop: 5,
    maxWidth: 210,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
});
