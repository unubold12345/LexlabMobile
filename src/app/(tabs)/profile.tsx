import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Screen } from "@/components/Screen";
import { Icon, IconName } from "@/components/Icon";
import {
  GlassCard,
  PressableScale,
  ProgressBar,
  Reveal,
  SectionHeader,
  StatTile,
  Tag,
} from "@/components/ui";
import { useProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";
import { useResponsive } from "@/lib/responsive";
import { colors, fonts, radii } from "@/lib/theme";

export default function Profile() {
  const progress = useProgress();
  const auth = useAuth();
  const [reminders, setReminders] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"signout" | "reset" | null>(null);
  const initial = progress.name.trim().charAt(0).toUpperCase() || "L";
  const levelPct = progress.levelInto / Math.max(1, progress.levelSpan);
  const signedIn = !!auth.user;
  const hasFull = auth.user?.role === "ADMIN" || !!auth.user?.paidAt || !!auth.user?.hasPaid;
  const { width, gutter, maxContentWidth, isTablet } = useResponsive();
  const contentWidth = Math.min(width, maxContentWidth) - gutter * 2;
  const achColumns = isTablet ? (contentWidth >= 660 ? 6 : 4) : 3;
  const achCellWidth = (contentWidth - 9 * (achColumns - 1)) / achColumns;

  const saveName = async () => {
    if (!signedIn || nameSaving) return;
    const name = progress.name.trim().replace(/\s+/g, " ");
    if (name === (auth.user?.name || "")) return;
    if (name.length < 2) {
      progress.setName(auth.user?.name || "Суралцагч");
      return;
    }
    setNameSaving(true);
    try {
      const res = await auth.apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        Alert.alert("Нэр хадгалах боломжгүй", data.error || "Дахин оролдоно уу.");
        progress.setName(auth.user?.name || "Суралцагч");
        return;
      }
      progress.setName(name);
      auth.setUser({ ...auth.user!, name });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2200);
      void progress.syncServer();
    } catch {
      Alert.alert("Сүлжээний алдаа", "Нэрийг серверт хадгалж чадсангүй.");
    } finally {
      setNameSaving(false);
    }
  };

  const signOut = () => {
    setConfirmAction("signout");
  };

  const achievements = useMemo(
    () => [
      { icon: "sparkles" as IconName, title: "Анхны алхам", desc: "1 асуулт", unlocked: progress.solved >= 1, tint: colors.lilac },
      { icon: "flame" as IconName, title: "7 өдрийн цуваа", desc: "7 хоног", unlocked: progress.streak >= 7, tint: colors.lilac },
      { icon: "target" as IconName, title: "50 зөв", desc: "50 хариулт", unlocked: progress.correct >= 50, tint: colors.lilac },
      { icon: "bolt" as IconName, title: "1000 XP", desc: "Туршлага", unlocked: progress.xp >= 1000, tint: colors.lilac },
      { icon: "trophy" as IconName, title: "Төгс оноо", desc: "100% үр дүн", unlocked: progress.history.some((h) => h.total > 0 && h.correct === h.total), tint: colors.lilac },
      { icon: "layers" as IconName, title: "10 дасгал", desc: "Идэвх", unlocked: progress.sessions >= 10, tint: colors.lilac },
    ],
    [progress.solved, progress.streak, progress.correct, progress.xp, progress.history, progress.sessions]
  );

  const reset = () => {
    setConfirmAction("reset");
  };

  return (
    <Screen>
      <Reveal delay={40}>
        {signedIn ? (
          <GlassCard style={styles.accountCard}>
            <View pointerEvents="none" style={styles.accountSheen} />
            <View style={styles.accountTop}>
              <View style={styles.accountIcon}>
                <Icon name="phone" size={17} color={colors.lilac} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName} numberOfLines={1}>
                  {auth.user?.name || "LEXLAB гишүүн"}
                </Text>
                <Text style={styles.accountPhone}>{formatPhone(auth.user?.phone)}</Text>
              </View>
              <Tag text={hasFull ? "PRO" : "ҮНЭГҮЙ"} tint={hasFull ? colors.amber : colors.muted} />
            </View>

            <View style={styles.accountStats}>
              <AccountStat label="Оролдлого" value={progress.server?.stats.attempts ?? 0} />
              <View style={styles.accountDivider} />
              <AccountStat label="Дундаж" value={progress.server?.stats.avgPct != null ? `${progress.server.stats.avgPct}%` : "—"} />
              <View style={styles.accountDivider} />
              <AccountStat label="Алдаа" value={progress.server?.stats.mistakes ?? 0} />
            </View>

            <View style={styles.accountFooter}>
              <View style={styles.syncRow}>
                <View style={[styles.syncDot, progress.serverSyncing && { backgroundColor: colors.amber }]} />
                <Text style={styles.syncText}>
                  {progress.serverSyncing ? "Серверээс шинэчилж байна..." : "Neon мэдээлэлтэй синхрон"}
                </Text>
              </View>
              <PressableScale onPress={() => void progress.syncServer()} scaleTo={0.9} disabled={progress.serverSyncing}>
                <View style={styles.syncButton}>
                  {progress.serverSyncing ? (
                    <ActivityIndicator size="small" color={colors.muted} />
                  ) : (
                    <Icon name="refresh" size={15} color={colors.muted} />
                  )}
                </View>
              </PressableScale>
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.guestCard}>
            <View pointerEvents="none" style={styles.accountSheen} />
            <View style={styles.guestTop}>
              <View style={styles.accountIcon}>
                <Icon name="user" size={17} color={colors.lilac} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>Зочноор ашиглаж байна</Text>
                <Text style={styles.guestDesc}>Бүх асуулт, явцаа хадгалахын тулд нэвтэрнэ үү.</Text>
              </View>
            </View>
            <PressableScale onPress={() => router.push("/login")} scaleTo={0.975}>
              <LinearGradient
                colors={["#4F5763", "#30353D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Бүртгэлдээ нэвтрэх</Text>
                <Icon name="arrowRight" size={16} color={colors.white} strokeWidth={2} />
              </LinearGradient>
            </PressableScale>
            <Text style={styles.guestHint}>Утасны дугаар + нууц үгээр нэвтэрнэ</Text>
          </GlassCard>
        )}
      </Reveal>

      <Reveal delay={60}>
        <PressableScale onPress={() => router.push("/upgrade")} scaleTo={0.98}>
          <GlassCard style={styles.upgradeCard}>
            <View style={[styles.upgradeIcon, hasFull && styles.upgradeIconFull]}>
              <Icon name={hasFull ? "shield" : "lock"} size={18} color={hasFull ? colors.emerald : colors.lilac} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>{hasFull ? "Бүтэн эрх нээгдсэн" : "Эрх авах"}</Text>
              <Text style={styles.upgradeDesc}>
                {hasFull ? "Бүх ангилал, шалгалт, хадгалах нээлттэй." : "Бүх сорилго, шалгалт, хадгалах — 39,900₮"}
              </Text>
            </View>
            <Tag text={hasFull ? "PRO" : "39,900₮"} tint={hasFull ? colors.emerald : colors.amber} />
            <Icon name="chevronRight" size={16} color={colors.dim} />
          </GlassCard>
        </PressableScale>
      </Reveal>

      <Reveal delay={80}>
        <GlassCard style={[styles.profileCard, isTablet && styles.profileCardTablet]}>
          <View style={styles.profileTop}>
            <LinearGradient
              colors={["#5D6470", "#343A43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.avatar, isTablet && styles.avatarTablet]}
            >
              <Text style={[styles.avatarText, isTablet && styles.avatarTextTablet]}>{initial}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <TextInput
                  value={progress.name}
                  onChangeText={(v) => {
                    progress.setName(v);
                    setNameSaved(false);
                  }}
                  onBlur={() => void saveName()}
                  onSubmitEditing={() => void saveName()}
                  style={[styles.nameInput, isTablet && styles.nameInputTablet]}
                  selectionColor={colors.violet}
                  maxLength={24}
                  placeholder="Таны нэр"
                  placeholderTextColor={colors.dim}
                  returnKeyType="done"
                />
                {nameSaving ? (
                  <ActivityIndicator size="small" color={colors.lilac} />
                ) : nameSaved ? (
                  <Icon name="check" size={14} color={colors.emerald} strokeWidth={2.4} />
                ) : (
                  <Icon name="edit" size={14} color={colors.dim} />
                )}
              </View>
              <Text style={styles.memberSince}>
                {signedIn ? "Серверт хадгалагдсан" : "Зөвхөн энэ төхөөрөмж дээр"} · Түвшин {progress.level}
              </Text>
            </View>
            <Tag text={`Lv ${progress.level}`} tint={colors.lilac} />
          </View>

          <View style={styles.levelBar}>
            <View style={styles.levelMeta}>
              <Text style={styles.levelLabel}>Дараагийн түвшин</Text>
              <Text style={styles.levelValue}>
                {progress.levelInto} / {progress.levelSpan} XP
              </Text>
            </View>
            <ProgressBar progress={levelPct} height={6} />
            <Text style={styles.levelTotal}>{progress.xp.toLocaleString()} нийт XP</Text>
          </View>
        </GlassCard>
      </Reveal>

      <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
        <View style={[styles.statsRow, isTablet && styles.statsRowTablet]}>
          <StatTile icon="target" value={`${progress.accuracyPct}%`} label="Нарийвчлал" tint={colors.lilac} delay={70} />
          <StatTile icon="check" value={`${progress.correct}`} label="Зөв хариулт" tint={colors.lilac} delay={110} />
        </View>
        <View style={[styles.statsRow, isTablet && styles.statsRowTablet]}>
          <StatTile icon="layers" value={`${progress.sessions}`} label="Дасгал" tint={colors.lilac} delay={150} />
          <StatTile icon="clock" value={`${progress.minutes}`} label="Минут" tint={colors.lilac} delay={190} />
        </View>
      </View>

      <SectionHeader title="Амжилтууд" caption={`${achievements.filter((a) => a.unlocked).length} / ${achievements.length} нээгдсэн`} />
      <View style={styles.achGrid}>
        {achievements.map((a, i) => (
          <Reveal
            key={a.title}
            delay={50 + i * 45}
            style={[styles.achCell, isTablet && { width: achCellWidth }]}
          >
            <View style={[styles.ach, !a.unlocked && styles.achLocked]}>
              <View style={[styles.achIcon, { backgroundColor: `${a.tint}16`, borderColor: `${a.tint}2e` }]}>
                <Icon name={a.icon} size={18} color={a.unlocked ? a.tint : colors.dim} />
              </View>
              <Text style={styles.achTitle}>{a.title}</Text>
              <Text style={styles.achDesc}>{a.desc}</Text>
              {!a.unlocked ? (
                <View style={styles.lock}>
                  <Icon name="lock" size={9} color={colors.dim} />
                </View>
              ) : null}
            </View>
          </Reveal>
        ))}
      </View>

      <SectionHeader title="Өдрийн зорилго" caption="Өдөрт хэдэн минут суралцах вэ?" />
      <Reveal delay={80}>
        <GlassCard style={styles.goalCard}>
          <View style={styles.goalRow}>
            {[20, 40, 60, 90].map((min) => (
              <PressableScale key={min} onPress={() => progress.setDailyGoal(min)} scaleTo={0.95} style={{ flex: 1 }}>
                {progress.dailyGoal === min ? (
                  <LinearGradient
                    colors={["#4F5763", "#30353D"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.goalChip}
                  >
                    <Text style={styles.goalValueActive}>{min}</Text>
                    <Text style={styles.goalUnitActive}>мин</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.goalChipIdle}>
                    <Text style={styles.goalValue}>{min}</Text>
                    <Text style={styles.goalUnit}>мин</Text>
                  </View>
                )}
              </PressableScale>
            ))}
          </View>
          <View style={styles.goalToday}>
            <Icon name="calendar" size={13} color={colors.dim} />
            <Text style={styles.goalTodayText}>
              Өнөөдөр {progress.todayMinutes} / {progress.dailyGoal} минут
            </Text>
          </View>
        </GlassCard>
      </Reveal>

      <SectionHeader title="Тохиргоо" />
      <Reveal delay={70}>
        <GlassCard>
          <SettingRow icon="moon" label="Харанхуй горим" value="Идэвхтэй" green />
          <SettingRow icon="bell" label="Сануулга" switchValue={reminders} onSwitch={setReminders} />
          <SettingRow icon="book" label="Хэл" value="Монгол" />
          <SettingRow icon="shield" label="Хувийн мэдээлэл" value="Хамгаалагдсан" />
          <SettingRow icon="award" label="Хувилбар" value="v1.0.0" last />
        </GlassCard>
      </Reveal>

      {signedIn ? (
        <Reveal delay={90}>
          <PressableScale onPress={signOut} style={{ marginTop: 12 }}>
            <View style={styles.logout}>
              <Icon name="logout" size={15} color={colors.muted} />
              <Text style={styles.logoutText}>Бүртгэлээс гарах</Text>
            </View>
          </PressableScale>
        </Reveal>
      ) : null}

      <Reveal delay={100}>
        <PressableScale onPress={reset} style={{ marginTop: 10 }}>
          <View style={styles.danger}>
            <Icon name="refresh" size={15} color={colors.rose} />
            <Text style={styles.dangerText}>Локал явцыг устгах</Text>
          </View>
        </PressableScale>
      </Reveal>

      <View style={styles.footer}>
        <Text style={styles.footerBrand}>LEXLAB · LAW EXAM STUDIO</Text>
        <Text style={styles.footerText}>
          Энэхүү апп нь сургалтын зориулалттай. Албан ёсны шалгалтын төлөөлөгч биш.
        </Text>
      </View>

      <ConfirmDialog
        visible={confirmAction !== null}
        title={confirmAction === "reset" ? "Явцыг устгах уу?" : "Бүртгэлээс гарах уу?"}
        message={
          confirmAction === "reset"
            ? "Бүх XP, дасгал, хадгалсан асуулт устах болно. Энэ үйлдлийг буцаах боломжгүй."
            : "Таны төхөөрөмж дээрх суралцах явц хэвээр үлдэнэ."
        }
        cancelText="Болих"
        confirmText={confirmAction === "reset" ? "Устгах" : "Гарах"}
        destructive
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          const action = confirmAction;
          setConfirmAction(null);
          if (action === "reset") progress.reset();
          if (action === "signout") void auth.signOut();
        }}
      />
    </Screen>
  );
}

function AccountStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.accountStat}>
      <Text style={styles.accountStatValue}>{value}</Text>
      <Text style={styles.accountStatLabel}>{label}</Text>
    </View>
  );
}

function formatPhone(phone?: string | null): string {
  if (!phone) return "Утас бүртгэгдээгүй";
  const clean = phone.replace(/[^\d+]/g, "");
  if (clean.startsWith("+976") && clean.length >= 12) {
    return `+976 ${clean.slice(4, 8)} ${clean.slice(8)}`;
  }
  if (clean.length === 8) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  return clean;
}

function SettingRow({
  icon,
  label,
  value,
  green,
  last,
  switchValue,
  onSwitch,
}: {
  icon: IconName;
  label: string;
  value?: string;
  green?: boolean;
  last?: boolean;
  switchValue?: boolean;
  onSwitch?: (v: boolean) => void;
}) {
  return (
    <PressableScale
      onPress={onSwitch ? () => onSwitch(!switchValue) : undefined}
      haptic={!!onSwitch}
      scaleTo={0.99}
    >
      <View style={[styles.settingRow, !last && styles.settingBorder]}>
        <View style={styles.settingIcon}>
          <Icon name={icon} size={16} color={colors.muted} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
        {onSwitch ? (
          <View style={[styles.switch, switchValue && styles.switchOn]}>
            <View style={[styles.knob, switchValue && styles.knobOn]} />
          </View>
        ) : (
          <Text style={[styles.settingValue, green && { color: colors.emerald }]}>{value}</Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  upgradeCard: {
    marginTop: 10,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  upgradeIconFull: {
    backgroundColor: `${colors.emerald}14`,
    borderColor: `${colors.emerald}35`,
  },
  upgradeTitle: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.text },
  upgradeDesc: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 15, color: colors.dim, marginTop: 2 },
  accountCard: { marginTop: 22, padding: 16, borderColor: "rgba(255,255,255,0.12)" },
  accountSheen: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  accountTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  accountIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  accountName: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.text },
  accountPhone: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 2, letterSpacing: 0.3 },
  accountStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  accountStat: { flex: 1, alignItems: "center", gap: 2 },
  accountStatValue: { fontFamily: fonts.display, fontSize: 15, color: colors.text },
  accountStatLabel: { fontFamily: fonts.body, fontSize: 9, color: colors.dim },
  accountDivider: { width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.06)" },
  accountFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 3 },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  syncDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.emerald },
  syncText: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim },
  syncButton: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)" },
  guestCard: { marginTop: 22, padding: 16 },
  guestTop: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 14 },
  guestDesc: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 3, lineHeight: 15 },
  loginButton: {
    height: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  loginButtonText: { fontFamily: fonts.bodyBold, fontSize: 12.8, color: colors.white },
  guestHint: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, textAlign: "center", marginTop: 9 },
  profileCard: { marginTop: 10, padding: 18 },
  profileCardTablet: { padding: 22 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: { width: 62, height: 62, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarTablet: { width: 74, height: 74, borderRadius: 26 },
  avatarText: { fontFamily: fonts.display, fontSize: 24, color: colors.white },
  avatarTextTablet: { fontSize: 28 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  nameInput: { fontFamily: fonts.display, fontSize: 19, color: colors.text, padding: 0, maxWidth: 170 },
  nameInputTablet: { fontSize: 22, maxWidth: 340 },
  memberSince: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim, marginTop: 4 },
  levelBar: { marginTop: 20 },
  levelMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  levelLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim },
  levelValue: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.lilac },
  levelTotal: { fontFamily: fonts.body, fontSize: 9.5, color: colors.dim, marginTop: 7, textAlign: "right" },
  statsGrid: { gap: 10, marginTop: 12 },
  statsGridTablet: { flexDirection: "row" },
  statsRow: { flexDirection: "row", gap: 10 },
  statsRowTablet: { flex: 1 },
  achGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  achCell: { width: "31%" },
  ach: { borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.card, padding: 12, gap: 6, minHeight: 116 },
  achLocked: { opacity: 0.42 },
  achIcon: { width: 32, height: 32, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  achTitle: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.text, lineHeight: 14 },
  achDesc: { fontFamily: fonts.body, fontSize: 8.5, color: colors.dim },
  lock: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center" },
  goalCard: { padding: 14 },
  goalRow: { flexDirection: "row", gap: 8 },
  goalChip: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  goalChipIdle: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSoft },
  goalValue: { fontFamily: fonts.display, fontSize: 16, color: colors.muted },
  goalValueActive: { fontFamily: fonts.display, fontSize: 16, color: colors.white },
  goalUnit: { fontFamily: fonts.body, fontSize: 8.5, color: colors.dim, marginTop: 1 },
  goalUnitActive: { fontFamily: fonts.body, fontSize: 8.5, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  goalToday: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  goalTodayText: { fontFamily: fonts.body, fontSize: 10.5, color: colors.muted },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 15, paddingVertical: 15 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  settingIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  settingLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.8, color: colors.text },
  settingValue: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.dim },
  switch: { width: 42, height: 25, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.08)", padding: 3, justifyContent: "center" },
  switchOn: { backgroundColor: "rgba(205,210,218,0.45)" },
  knob: { width: 19, height: 19, borderRadius: 10, backgroundColor: "#B9B7C9" },
  knobOn: { backgroundColor: colors.white, alignSelf: "flex-end" },
  logout: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.025)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted },
  danger: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: "rgba(251,113,133,0.3)", backgroundColor: "rgba(225,29,72,0.08)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dangerText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.rose },
  footer: { marginTop: 26, alignItems: "center", gap: 7 },
  footerBrand: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.25)" },
  footerText: { fontFamily: fonts.body, fontSize: 9.5, color: "rgba(255,255,255,0.22)", textAlign: "center", maxWidth: 260, lineHeight: 14 },
});
