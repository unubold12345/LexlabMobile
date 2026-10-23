import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors, fonts, radii } from "@/lib/theme";

type Announcement = {
  id: string;
  body: string;
  createdAt: string;
  read: boolean;
};

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function NotificationBell() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (!auth.token) {
      setItems([]);
      setUnread(0);
      return;
    }
    setLoading(true);
    try {
      const res = await auth.apiFetch("/api/announcements");
      if (!res.ok) return;
      const data = (await res.json()) as { announcements?: Announcement[]; unread?: number };
      setItems(Array.isArray(data.announcements) ? data.announcements : []);
      setUnread(typeof data.unread === "number" ? data.unread : 0);
      loaded.current = true;
    } catch {
      // keep the last known list
    } finally {
      setLoading(false);
    }
  }, [auth.token, auth.apiFetch]);

  useEffect(() => {
    void load();
    if (!auth.token) return;
    const timer = setInterval(() => void load(), 60000);
    return () => clearInterval(timer);
  }, [load, auth.token]);

  const markAllRead = useCallback(async () => {
    if (!auth.token || unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await auth.apiFetch("/api/announcements/read", { method: "POST", body: JSON.stringify({}) });
    } catch {
      // optimistic; next poll reconciles
    }
  }, [auth.token, auth.apiFetch, unread]);

  if (!auth.token) return null;

  return (
    <>
      <PressableScale
        onPress={() => {
          setOpen(true);
          if (!loaded.current) void load();
        }}
        scaleTo={0.92}
        accessibilityLabel="Мэдэгдэл"
      >
        <View style={styles.bell}>
          <Icon name="bell" size={16} color={colors.muted} strokeWidth={1.9} />
          {unread > 0 ? <View style={styles.dot} /> : null}
        </View>
      </PressableScale>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Хаах" />
          <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>LEXLAB</Text>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Мэдэгдэл</Text>
                  {unread > 0 ? (
                    <View style={styles.unreadPill}>
                      <Text style={styles.unreadText}>{unread} шинэ</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <PressableScale onPress={() => setOpen(false)} scaleTo={0.9} accessibilityLabel="Хаах">
                <View style={styles.close}>
                  <Icon name="close" size={15} color={colors.muted} />
                </View>
              </PressableScale>
            </View>

            {unread > 0 ? (
              <PressableScale onPress={() => void markAllRead()} scaleTo={0.97}>
                <View style={styles.markAll}>
                  <Icon name="check" size={13} color={colors.lilac} strokeWidth={2.2} />
                  <Text style={styles.markAllText}>Бүгдийг уншсан</Text>
                </View>
              </PressableScale>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {items.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="bell" size={22} color={colors.dim} />
                  <Text style={styles.emptyText}>
                    {loading ? "Ачаалж байна…" : "Мэдэгдэл одоогоор байхгүй байна."}
                  </Text>
                </View>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={[styles.item, !item.read && styles.itemUnread]}>
                    <View style={styles.itemHead}>
                      <View style={[styles.itemDot, item.read && { backgroundColor: "transparent" }]} />
                      <Text style={styles.itemDate}>{when(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.itemBody}>{item.body}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bell: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.rose,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(3,3,8,0.72)",
  },
  panel: {
    maxHeight: "78%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0C0C13",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.8, color: colors.lilac },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: "rgba(251,113,133,0.14)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.24)",
  },
  unreadText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.rose },
  close: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  markAll: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  markAllText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.lilac },
  list: { paddingTop: 14, gap: 9, paddingBottom: 8 },
  empty: { alignItems: "center", gap: 9, paddingVertical: 42 },
  emptyText: { fontFamily: fonts.body, fontSize: 12, color: colors.dim },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.028)",
    padding: 14,
  },
  itemUnread: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.1)" },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  itemDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.lilac },
  itemDate: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
  itemBody: { fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 19, color: colors.text, marginTop: 7 },
});
