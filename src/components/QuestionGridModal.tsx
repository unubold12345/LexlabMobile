import React, { useMemo } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui";
import { useResponsive } from "@/lib/responsive";
import { colors, fonts } from "@/lib/theme";

const GAP = 8;

export function QuestionGridModal({
  visible,
  onClose,
  title,
  meta,
  metaAccent = false,
  total,
  currentIndex,
  answeredIndexes,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  meta?: string;
  metaAccent?: boolean;
  total: number;
  currentIndex: number;
  answeredIndexes?: Set<number>;
  onSelect: (index: number) => void;
}) {
  const { width, height, isTablet } = useResponsive();
  const columns = isTablet ? 6 : 5;
  const cardMaxWidth = isTablet ? 560 : 420;
  const cardPadding = isTablet ? 20 : 16;
  const cellHeight = isTablet ? 40 : 36;
  const cardWidth = Math.min(width - 40, cardMaxWidth);
  const innerWidth = cardWidth - cardPadding * 2;
  const cellWidth = Math.floor((innerWidth - GAP * (columns - 1)) / columns);
  const listMaxHeight = Math.max(180, Math.min(height - 180, 560));
  const answeredCount = answeredIndexes?.size ?? 0;
  const items = useMemo(() => Array.from({ length: total }, (_, index) => index), [total]);
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(0, total - 1));
  const initialIndex = total > columns * 3 ? Math.max(0, Math.floor(safeIndex / columns) - 1) : 0;

  const getItemLayout = (_data: ArrayLike<number> | null | undefined, index: number) => ({
    length: cellHeight + GAP,
    offset: index * (cellHeight + GAP),
    index,
  });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Хаах" />
        <View style={[styles.card, { maxWidth: cardMaxWidth, maxHeight: height - 40, padding: cardPadding }]}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {meta ? <Text style={[styles.meta, metaAccent && styles.metaAccent]}>{meta}</Text> : null}
            </View>
            <PressableScale onPress={onClose} scaleTo={0.9} accessibilityLabel="Хаах">
              <View style={styles.close}>
                <Icon name="close" size={14} color={colors.muted} />
              </View>
            </PressableScale>
          </View>

          {visible ? (
            <FlatList
              key={columns}
              data={items}
              numColumns={columns}
              keyExtractor={(item) => String(item)}
              initialScrollIndex={initialIndex}
              getItemLayout={getItemLayout}
              style={[styles.list, { maxHeight: listMaxHeight }]}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isCurrent = item === safeIndex;
                const isAnswered = answeredIndexes?.has(item) ?? false;
                return (
                  <PressableScale
                    onPress={() => onSelect(item)}
                    scaleTo={0.9}
                    style={{ width: cellWidth }}
                    contentStyle={styles.cellContent}
                    accessibilityLabel={`Асуулт ${item + 1}${isCurrent ? ", одоогийн" : ""}`}
                  >
                    <View
                      style={[
                        styles.number,
                        { height: cellHeight },
                        isAnswered && styles.answered,
                        isCurrent && styles.current,
                      ]}
                    >
                      <Text style={[styles.numberText, isAnswered && styles.answeredText, isCurrent && styles.currentText]}>
                        {item + 1}
                      </Text>
                    </View>
                  </PressableScale>
                );
              }}
            />
          ) : null}

          <View style={styles.legend}>
            {answeredIndexes ? (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "rgba(52,211,153,0.7)" }]} />
                <Text style={styles.legendText}>Хариулсан {answeredCount}</Text>
              </View>
            ) : null}
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.lilac }]} />
              <Text style={styles.legendText}>Одоогийн {safeIndex + 1}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "rgba(255,255,255,0.18)" }]} />
              <Text style={styles.legendText}>
                {answeredIndexes ? `Үлдсэн ${Math.max(0, total - answeredCount)}` : `Нийт ${total}`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3,3,8,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#101018",
    padding: 16,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 3 },
  metaAccent: { color: colors.emerald },
  close: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  list: { width: "100%", flexGrow: 0, flexShrink: 1, marginTop: 14 },
  listContent: { gap: GAP, paddingBottom: 2 },
  row: { gap: GAP },
  cellContent: { width: "100%" },
  number: {
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  answered: { backgroundColor: "rgba(52,211,153,0.20)", borderColor: "rgba(52,211,153,0.38)" },
  current: { borderColor: colors.lilac, borderWidth: 1.5, backgroundColor: "rgba(205,210,218,0.10)" },
  numberText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted },
  answeredText: { color: colors.white },
  currentText: { color: colors.text },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontFamily: fonts.body, fontSize: 8.5, color: colors.dim },
});
