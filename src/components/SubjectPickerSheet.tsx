import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui";
import { useBank } from "@/lib/bank";
import { useResponsive } from "@/lib/responsive";
import { colors, fonts, radii } from "@/lib/theme";

const TINTS = ["#CDD2DA"];

function shortName(name: string): string {
  return name.replace(/^\d+\.\s+/, "");
}

type Group = {
  main: string;
  total: number;
  tint: string;
  subs: { name: string; count: number }[];
};

export function SubjectPickerSheet({
  visible,
  onClose,
  onSelect,
  eyebrow = "ТӨЛӨВЛӨГӨӨ",
  title = "Сэдэв сонгох",
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (main: string, sub: string) => void;
  eyebrow?: string;
  title?: string;
}) {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const bank = useBank();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!visible) {
      setExpanded({});
      setQuery("");
    }
  }, [visible]);

  const groups = useMemo<Group[]>(() => {
    const needle = query.trim().toLowerCase();
    return bank.mains
      .map((group, mainIndex) => {
        const main = group.name;
        const mainMatch = !needle || main.toLowerCase().includes(needle);
        const subs = mainMatch
          ? group.subs
          : group.subs.filter((s) => s.name.toLowerCase().includes(needle));
        return {
          main,
          total: group.total,
          tint: TINTS[mainIndex % TINTS.length],
          subs,
          matches: mainMatch || subs.length > 0,
        };
      })
      .filter((g) => g.matches && g.total > 0)
      .map(({ main, total, tint, subs }) => ({ main, total, tint, subs }));
  }, [bank, query]);

  const choose = (main: string, sub: string) => {
    onSelect(main, sub);
    setQuery("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Хаах" />
        <View
          style={[
            styles.sheet,
            isTablet && styles.sheetTablet,
            {
              paddingTop: isTablet ? Math.max(insets.top, 18) : insets.top > 0 ? insets.top + 8 : 18,
              marginTop: isTablet ? Math.max(insets.top + 56, 72) : 38,
              marginBottom: isTablet ? Math.max(24, insets.bottom) : 0,
              maxWidth: isTablet ? 760 : undefined,
            },
          ]}
        >
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <PressableScale onPress={onClose} scaleTo={0.9}>
              <View style={styles.close}>
                <Icon name="close" size={16} color={colors.muted} />
              </View>
            </PressableScale>
          </View>

          <View style={styles.search}>
            <Icon name="search" size={15} color={colors.dim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Сэдэв эсвэл дэд ангилал хайх"
              placeholderTextColor={colors.dim}
              style={styles.searchInput}
              selectionColor={colors.lilac}
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Icon name="close" size={14} color={colors.dim} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 26 }]}
          >
            <PressableScale onPress={() => choose("all", "")} scaleTo={0.98}>
              <View style={styles.allRow}>
                <View style={styles.allIcon}>
                  <Icon name="layers" size={17} color={colors.lilac} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.allTitle}>Бүх сэдэв</Text>
                  <Text style={styles.allMeta}>{bank.total.toLocaleString()} асуулт</Text>
                </View>
                <Icon name="plus" size={16} color={colors.lilac} />
              </View>
            </PressableScale>

            {groups.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="search" size={24} color={colors.dim} />
                <Text style={styles.emptyText}>Тохирох сэдэв олдсонгүй.</Text>
              </View>
            ) : null}

            {groups.map((group) => {
              const open = query.trim().length > 0 || !!expanded[group.main];
              return (
                <View key={group.main} style={styles.group}>
                  <Pressable onPress={() => setExpanded((prev) => ({ ...prev, [group.main]: !open }))}>
                    <View style={styles.groupHead}>
                      <View style={[styles.groupIcon, { backgroundColor: `${group.tint}1F`, borderColor: `${group.tint}45` }]}>
                        <Icon name="book" size={15} color={group.tint} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={styles.groupName}>
                          {shortName(group.main)}
                        </Text>
                        <Text style={styles.groupMeta}>
                          {group.subs.length} дэд ангилал · {group.total.toLocaleString()} асуулт
                        </Text>
                      </View>
                      <View style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}>
                        <Icon name="chevronRight" size={15} color={colors.dim} />
                      </View>
                    </View>
                  </Pressable>

                  {open ? (
                    <View style={styles.subs}>
                      {group.subs.map((sub) => (
                        <PressableScale key={sub.name} onPress={() => choose(group.main, sub.name)} scaleTo={0.98}>
                          <View style={styles.subRow}>
                            <View style={[styles.subDot, { backgroundColor: group.tint }]} />
                            <Text numberOfLines={2} style={styles.subName}>
                              {sub.name}
                            </Text>
                            <Text style={styles.subCount}>{sub.count}</Text>
                            <View style={styles.add}>
                              <Icon name="plus" size={13} color={colors.lilac} />
                            </View>
                          </View>
                        </PressableScale>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(3,3,8,0.72)",
  },
  sheet: {
    flex: 1,
    marginTop: 38,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0C0C13",
    paddingHorizontal: 20,
  },
  sheetTablet: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.8, color: colors.lilac },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginTop: 4 },
  close: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSoft },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginTop: 18,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.text, paddingVertical: 0 },
  list: { paddingTop: 14, gap: 8 },
  allRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  allIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
  allTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  allMeta: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 2 },
  group: { borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.028)", overflow: "hidden" },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 11, padding: 12 },
  groupIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  groupName: { fontFamily: fonts.bodySemi, fontSize: 12.8, color: colors.text },
  groupMeta: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, marginTop: 3 },
  subs: { paddingHorizontal: 11, paddingBottom: 8, gap: 2 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.03)", marginTop: 4 },
  subDot: { width: 5, height: 5, borderRadius: 3 },
  subName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 10.8, lineHeight: 15, color: colors.muted },
  subCount: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: colors.dim },
  add: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  empty: { alignItems: "center", gap: 8, paddingVertical: 36 },
  emptyText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.dim },
});
