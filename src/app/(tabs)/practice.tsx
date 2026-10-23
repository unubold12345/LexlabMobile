import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/Screen";
import { Icon, IconName } from "@/components/Icon";
import { PressableScale, Reveal } from "@/components/ui";
import { useBank } from "@/lib/bank";
import { useProgress } from "@/lib/progress";
import { colors, fonts } from "@/lib/theme";

type Mode = {
  key: string;
  route: "/exam-setup" | "/saved" | "/mistakes" | "/custom";
  icon: IconName;
  title: string;
  desc: string;
};

const MODES: Mode[] = [
  {
    key: "exam",
    route: "/exam-setup",
    icon: "target",
    title: "Шалгалт",
    desc: "Ангилал, төрөл, тоогоо сонгоод шалгалт эсвэл сургалт эхлүүлнэ",
  },
  {
    key: "saved",
    route: "/saved",
    icon: "bookmark",
    title: "Хадгалсан",
    desc: "Түр зогсоосон шалгалтаа явсан газраасаа үргэлжлүүлнэ",
  },
  {
    key: "mistakes",
    route: "/mistakes",
    icon: "trending",
    title: "Их алддаг",
    desc: "Алдсан асуултаа цуглуулж, зөвхөн тэдгээрээр дахин давтана",
  },
  {
    key: "custom",
    route: "/custom",
    icon: "layers",
    title: "Угсрах",
    desc: "Сэдэв тус бүрээс тоогоо сонгож өөрийн шалгалтаа угсарна",
  },
];

export default function Practice() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bank = useBank();
  const progress = useProgress();
  const wrongCount = Object.keys(progress.wrong).length;

  return (
    <Screen scroll={false}>
      <View style={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        <Reveal delay={60}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{bank.total.toLocaleString()}</Text>
              <Text style={styles.metaLabel}>асуултын сан</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{wrongCount}</Text>
              <Text style={styles.metaLabel}>алдсан</Text>
            </View>
            <View style={{ flex: 1 }} />
            <PressableScale onPress={() => void bank.refresh()} scaleTo={0.94} accessibilityLabel="Асуултын санг шинэчлэх">
              <View style={styles.sync}>
                <View
                  style={[
                    styles.syncDot,
                    { backgroundColor: bank.lastError ? colors.rose : bank.live ? colors.emerald : colors.amber },
                  ]}
                />
                <Text style={styles.syncText}>
                  {bank.lastError ? "Сан алдаатай" : bank.live ? "Онлайн сан" : "Локал сан"}
                </Text>
                <Icon name="refresh" size={12} color={colors.dim} />
              </View>
            </PressableScale>
          </View>
        </Reveal>

        <View style={styles.grid}>
          {MODES.map((mode, index) => (
            <Reveal key={mode.key} delay={90 + index * 55} style={styles.cell}>
              <PressableScale
                onPress={() => router.push(mode.route)}
                style={styles.cell}
                contentStyle={styles.cell}
                accessibilityLabel={mode.title}
              >
                <View style={styles.tile}>
                  <View style={styles.iconWrap}>
                    <Icon name={mode.icon} size={26} color={colors.lilac} strokeWidth={1.6} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.title}>{mode.title}</Text>
                    <Text numberOfLines={2} style={styles.desc}>
                      {mode.desc}
                    </Text>
                  </View>
                  <View style={styles.arrow}>
                    <Icon name="arrowRight" size={15} color={colors.muted} />
                  </View>
                </View>
              </PressableScale>
            </Reveal>
          ))}
        </View>

        <Reveal delay={320}>
          <View style={styles.tip}>
            <Icon name="sparkles" size={14} color={colors.dim} />
            <Text style={styles.tipText}>Бүх горимд хариултын дарааллыг холино — шалгалт бүр өөр байна.</Text>
          </View>
        </Reveal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 18 },
  metaItem: { gap: 2 },
  metaValue: { fontFamily: fonts.display, fontSize: 16, color: colors.text },
  metaLabel: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
  metaDivider: { width: 1, height: 24, backgroundColor: colors.borderSoft },
  sync: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  syncDot: { width: 5, height: 5, borderRadius: 3 },
  syncText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted },
  grid: { flex: 1, gap: 10, marginTop: 18 },
  cell: { flex: 1, minHeight: 88 },
  tile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    backgroundColor: "rgba(255,255,255,0.042)",
    overflow: "hidden",
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.text, letterSpacing: -0.4 },
  desc: { fontFamily: fonts.body, fontSize: 10, lineHeight: 15, color: colors.dim, marginTop: 4 },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  tip: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, opacity: 0.75 },
  tipText: { flex: 1, fontFamily: fonts.body, fontSize: 10, lineHeight: 15, color: colors.dim },
});
