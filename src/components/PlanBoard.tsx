import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@/components/Icon";
import { SubjectPickerSheet } from "@/components/SubjectPickerSheet";
import { PressableScale, ProgressBar } from "@/components/ui";
import { useBank } from "@/lib/bank";
import { planDayTitle, shiftPlanDay, todayKey, usePlan, type PlanItem } from "@/lib/plan";
import { colors, fonts, radii } from "@/lib/theme";

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

function itemTitle(item: PlanItem): string {
  if (item.text?.trim()) return item.text.trim();
  if (item.sub && item.sub !== "all") return shortName(item.sub);
  if (item.main === "all") return "Бүх сэдэв";
  return shortName(item.main);
}

export function PlanBoard({
  onStart,
}: {
  onStart: (main: string, sub: string, total: number) => void;
}) {
  const bank = useBank();
  const plan = usePlan();
  const [date, setDate] = useState(todayKey());
  const [picker, setPicker] = useState(false);

  const items = useMemo(
    () => plan.items.filter((item) => item.date === date),
    [plan.items, date]
  );
  const done = items.filter((item) => item.done).length;
  const pct = items.length > 0 ? done / items.length : 0;

  const startItem = (item: PlanItem) => {
    const sub = item.sub === "all" ? "" : item.sub;
    const total = item.main === "all" ? bank.total : bank.byMain(item.main, sub || undefined).length;
    onStart(item.main, sub, total);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dateCard}>
        <Pressable onPress={() => setDate(shiftPlanDay(date, -1))} style={styles.dateArrow} hitSlop={6}>
          <Icon name="chevronLeft" size={16} color={colors.muted} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.dateTitle}>{planDayTitle(date)}</Text>
          <Text style={styles.dateMeta}>{date}</Text>
        </View>
        <Pressable onPress={() => setDate(shiftPlanDay(date, 1))} style={styles.dateArrow} hitSlop={6}>
          <Icon name="chevronRight" size={16} color={colors.muted} />
        </Pressable>
        {date !== todayKey() ? (
          <Pressable onPress={() => setDate(todayKey())} style={styles.todayBtn}>
            <Text style={styles.todayText}>Өнөөдөр</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryEyebrow}>ӨДРИЙН ГҮЙЦЭТГЭЛ</Text>
            <Text style={styles.summaryValue}>
              {done} <Text style={styles.summaryDim}>/ {items.length}</Text>
            </Text>
          </View>
          <Text style={styles.summaryPct}>{Math.round(pct * 100)}%</Text>
        </View>
        <ProgressBar progress={pct} height={6} />
        <View style={styles.summaryFoot}>
          <View style={[styles.dot, { backgroundColor: plan.synced ? colors.emerald : colors.amber }]} />
          <Text style={styles.summaryNote}>
            {plan.synced ? "Neon бүртгэлтэй синхрончлогдоно" : "Зөвхөн энэ төхөөрөмж дээр хадгална"}
          </Text>
        </View>
      </View>

      <PressableScale onPress={() => setPicker(true)} scaleTo={0.97}>
        <LinearGradient
          colors={["#4F5763", "#30353D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addButton}
        >
          <Icon name="plus" size={17} color={colors.white} strokeWidth={2.4} />
          <Text style={styles.addText}>Зорилт нэмэх</Text>
        </LinearGradient>
      </PressableScale>

      <View style={styles.listHead}>
        <Text style={styles.listTitle}>Төлөвлөгөө</Text>
        {done > 0 ? (
          <Pressable onPress={() => plan.clearDone(date)} hitSlop={8}>
            <Text style={styles.clearDone}>Дууссанг цэвэрлэх</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: 9 }}>
        {items.map((item) => {
          const scope =
            item.sub && item.sub !== "all"
              ? `${shortName(item.main)} · ${item.sub}`
              : item.main === "all"
                ? "Бүх сэдэв"
                : shortName(item.main);
          return (
            <View key={item.id} style={[styles.row, item.done && styles.rowDone]}>
              <Pressable onPress={() => plan.toggle(item.id)} hitSlop={8}>
                <View style={[styles.check, item.done && styles.checkDone]}>
                  {item.done ? <Icon name="check" size={13} color="#052E22" strokeWidth={2.8} /> : null}
                </View>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, item.done && styles.rowTitleDone]} numberOfLines={2}>
                  {itemTitle(item)}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.text ? scope : `${scope} · бэлэн`}
                </Text>
              </View>
              <PressableScale onPress={() => startItem(item)} scaleTo={0.88} accessibilityLabel={`${itemTitle(item)} эхлүүлэх`}>
                <View style={styles.play}>
                  <Icon name="play" size={13} color={colors.lilac} strokeWidth={2.4} />
                </View>
              </PressableScale>
              <Pressable onPress={() => plan.remove(item.id)} hitSlop={8} accessibilityLabel="Зорилт устгах" accessibilityRole="button">
                <View style={styles.trash}>
                  <Icon name="close" size={13} color={colors.dim} />
                </View>
              </Pressable>
            </View>
          );
        })}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="calendar" size={23} color={colors.lilac} />
            </View>
            <Text style={styles.emptyTitle}>Төлөвлөгөө хоосон байна</Text>
            <Text style={styles.emptyText}>
              Сэдэв сонгоод өнөөдрийн сурах зорилтоо нэмээрэй. Дарахад шалгалт эсвэл дасгал шууд эхэлнэ.
            </Text>
          </View>
        ) : null}
      </View>

      {!plan.synced ? (
        <View style={styles.guestNote}>
          <Icon name="shield" size={13} color={colors.dim} />
          <Text style={styles.guestText}>
            Профайл хэсгээр нэвтэрвэл төлөвлөгөө бүх төхөөрөмж дээр хадгалагдана.
          </Text>
        </View>
      ) : null}

      <SubjectPickerSheet
        visible={picker}
        onClose={() => setPicker(false)}
        onSelect={(main, sub) => {
          plan.add({
            main,
            sub,
            text: main === "all" ? "Бүх сэдэв" : "",
            date,
          });
          setPicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 22, gap: 12 },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  dateArrow: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  dateTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  dateMeta: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 2, letterSpacing: 0.5 },
  todayBtn: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  todayText: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.lilac },
  summary: {
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  summaryTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 13 },
  summaryEyebrow: { fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 1.5, color: colors.lilac },
  summaryValue: { fontFamily: fonts.display, fontSize: 23, color: colors.text, marginTop: 4 },
  summaryDim: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.dim },
  summaryPct: { fontFamily: fonts.display, fontSize: 19, color: colors.lilac },
  summaryFoot: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 11 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  summaryNote: { flex: 1, fontFamily: fonts.body, fontSize: 9, color: colors.dim },
  addButton: { height: 50, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white },
  listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  listTitle: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.text },
  clearDone: { fontFamily: fonts.bodyMedium, fontSize: 9.5, color: colors.rose },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.032)",
  },
  rowDone: { opacity: 0.58 },
  check: { width: 23, height: 23, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  checkDone: { borderColor: colors.emerald, backgroundColor: colors.emerald },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, color: colors.text },
  rowTitleDone: { textDecorationLine: "line-through", color: colors.muted },
  rowMeta: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, marginTop: 3 },
  play: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.13)" },
  trash: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 24, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.borderSoft, borderStyle: "dashed" },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.text, marginTop: 10 },
  emptyText: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 16, color: colors.dim, textAlign: "center", marginTop: 5, maxWidth: 250 },
  guestNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 6, opacity: 0.8 },
  guestText: { flex: 1, fontFamily: fonts.body, fontSize: 9.5, lineHeight: 14, color: colors.dim },
});
