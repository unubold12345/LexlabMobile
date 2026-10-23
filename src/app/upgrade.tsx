import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { GlassCard, PressableScale, Reveal, Tag } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useBank } from "@/lib/bank";
import { colors, fonts, radii } from "@/lib/theme";

type PaymentRequest = { id: string; status: string; createdAt: string };

const FEATURES = [
  "Бүх дэд ангиллын сорилго харах",
  "Бүх ангиллаар шалгалт өгөх",
  "Зөв хариулт хадгалах",
  "Шалгалт түр зогсоож, үргэлжлүүлэх",
];

const STEPS = [
  { n: "1", title: "Дансаар төлөх", desc: "Доорх дансанд 39,900₮ шилжүүлнэ." },
  { n: "2", title: "Төлбөр төлснөө мэдэгдэх", desc: "Хүсэлт илгээх товч дарж мэдэгдэнэ." },
  { n: "3", title: "Эрх нээгдэнэ", desc: "Админ шалгасны дараа бүх ангилал нээгдэнэ." },
];

export default function Upgrade() {
  const auth = useAuth();
  const bank = useBank();
  const mounted = useRef(true);
  const [paid, setPaid] = useState(auth.user?.role === "ADMIN" || !!auth.user?.paidAt || !!auth.user?.hasPaid);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freeMain = bank.mains.find((main) => main.name.startsWith("1. "));
  const freeCount = freeMain?.total ?? 0;
  const pending = request?.status === "PENDING";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!auth.token) return;
    void loadStatus(true);
  }, [auth.token]);

  useEffect(() => {
    if (!auth.token || !pending) return;
    const timer = setInterval(() => void loadStatus(false), 10000);
    return () => clearInterval(timer);
  }, [auth.token, pending]);

  async function loadStatus(initial: boolean) {
    if (initial) setLoading(true);
    try {
      const res = await auth.apiFetch("/api/payment-requests");
      if (!res.ok) return;
      const data = (await res.json()) as { hasPaid?: boolean; request?: PaymentRequest | null };
      if (!mounted.current) return;
      if (data.hasPaid) {
        setPaid(true);
        void auth.refreshUser();
      }
      setRequest(data.request ?? null);
    } catch {
      if (initial && mounted.current) setError("Төлөв шалгах боломжгүй байна.");
    } finally {
      if (initial && mounted.current) setLoading(false);
    }
  }

  async function sendRequest() {
    if (!accepted || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await auth.apiFetch("/api/payment-requests", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; paid?: boolean; request?: PaymentRequest };
      if (!res.ok) {
        if (mounted.current) setError(data.error || "Хүсэлт илгээх боломжгүй байна.");
        return;
      }
      if (!mounted.current) return;
      if (data.paid) {
        setPaid(true);
        void auth.refreshUser();
      } else if (data.request) {
        setRequest(data.request);
      }
    } catch {
      if (mounted.current) setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      if (mounted.current) setSending(false);
    }
  }

  if (paid) {
    return (
      <Screen>
        <PageHeader backTo="/profile" />
        <Reveal>
          <GlassCard style={styles.successCard}>
            <View style={styles.successIcon}>
              <Icon name="shield" size={26} color={colors.emerald} strokeWidth={1.8} />
            </View>
            <Text style={styles.successTitle}>Эрх нээгдсэн</Text>
            <Text style={styles.successDesc}>Танд бүх ангилал, шалгалт, хадгалах цэс нээлттэй.</Text>
            <PressableScale onPress={() => router.push("/subjects")} scaleTo={0.98}>
              <LinearGradient
                colors={["#4F5763", "#30353D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryText}>Бүх сорилго</Text>
                <Icon name="arrowRight" size={16} color={colors.white} strokeWidth={2} />
              </LinearGradient>
            </PressableScale>
            <PressableScale onPress={() => router.push("/exam-setup")} scaleTo={0.98}>
              <View style={styles.ghostButton}>
                <Text style={styles.ghostText}>Шалгалт өгөх</Text>
              </View>
            </PressableScale>
          </GlassCard>
        </Reveal>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader backTo="/profile" />

      <Reveal delay={40}>
        <GlassCard style={styles.hero}>
          <View style={styles.heroTop}>
            <Tag text="Төлбөртэй төлөвлөгөө" tint={colors.lilac} />
            <Tag text="PRO" tint={colors.amber} />
          </View>
          <Text style={styles.heroTitle}>Бүтэн эрх</Text>
          <Text style={styles.heroPrice}>39,900₮</Text>
          <Text style={styles.heroMeta}>Нэг удаагийн төлбөр · насан турш</Text>

          <View style={styles.compare}>
            <View style={styles.compareRow}>
              <View style={styles.compareIcon}>
                <Icon name="lock" size={14} color={colors.dim} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.compareLabel}>Үнэгүй</Text>
                <Text style={styles.compareValue} numberOfLines={2}>
                  1. Нийтийн эрх зүй · {freeCount.toLocaleString()} сорилго
                </Text>
              </View>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareRow}>
              <View style={[styles.compareIcon, styles.compareIconActive]}>
                <Icon name="shield" size={14} color={colors.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.compareLabel}>Эрхтэй</Text>
                <Text style={styles.compareValue}>Бүх ангилал + хадгалах</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={80}>
        <GlassCard style={styles.featureCard}>
          <Text style={styles.cardEyebrow}>ЭРХТЭЙ БОЛОХОД</Text>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Icon name="check" size={12} color={colors.emerald} strokeWidth={2.6} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </GlassCard>
      </Reveal>

      <Reveal delay={120}>
        <GlassCard style={styles.bankCard}>
          <View style={styles.bankHead}>
            <View style={styles.bankIcon}>
              <Icon name="scale" size={17} color={colors.lilac} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankTitle}>Голомт банк</Text>
              <Text style={styles.bankSub}>Дансаар төлөх</Text>
            </View>
            <Tag text="39,900₮" tint={colors.lilac} />
          </View>
          <BankRow label="IBAN" value="86001500" />
          <BankRow label="Данс" value="1105 7894 22" />
          <BankRow label="Хүлээн авагч" value="П. ГАНБАЯР" />
          <BankRow label="Гүйлгээний утга" value="Бүртгэлтэй утасны дугаар" />
        </GlassCard>
      </Reveal>

      <Reveal delay={160}>
        <View style={styles.steps}>
          {STEPS.map((step) => (
            <View key={step.n} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </Reveal>

      <Reveal delay={200}>
        <GlassCard style={styles.payCard}>
          <Text style={styles.payTitle}>Төлбөр төлснөө мэдэгдэх</Text>

          {!auth.user ? (
            <>
              <Text style={styles.payDesc}>Хүсэлт илгээхийн тулд бүртгэлдээ нэвтэрнэ үү.</Text>
              <PressableScale onPress={() => router.push("/login")} scaleTo={0.98}>
                <LinearGradient
                  colors={["#4F5763", "#30353D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryText}>Нэвтрэх</Text>
                  <Icon name="arrowRight" size={16} color={colors.white} strokeWidth={2} />
                </LinearGradient>
              </PressableScale>
            </>
          ) : pending ? (
            <>
              <View style={styles.pendingBox}>
                <View style={styles.pendingDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTitle}>Хүсэлт илгээгдсэн</Text>
                  <Text style={styles.pendingDesc}>Админ төлбөрийг шалгаад эрхийг нээнэ. Энэ хуудас 10 секунд тутамд шинэчлэгдэнэ.</Text>
                </View>
              </View>
              <PressableScale onPress={() => void loadStatus(false)} scaleTo={0.98} disabled={loading}>
                <View style={styles.ghostButton}>
                  <Icon name="refresh" size={15} color={colors.muted} />
                  <Text style={styles.ghostText}>{loading ? "Шалгаж байна..." : "Төлөв шалгах"}</Text>
                </View>
              </PressableScale>
            </>
          ) : (
            <>
              <Text style={styles.payDesc}>Төлбөр төлсний дараа доорх товчоор мэдэгдэнэ үү. Админ шалгаад эрхийг нээнэ.</Text>
              {request && request.status !== "PENDING" ? (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Өмнөх хүсэлтийн төлөв:</Text>
                  <Tag text={request.status} tint={colors.amber} />
                </View>
              ) : null}
              <Pressable onPress={() => setAccepted((value) => !value)} style={styles.termsRow} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}>
                <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
                  {accepted ? <Icon name="check" size={12} color={colors.bg} strokeWidth={3} /> : null}
                </View>
                <Text style={styles.termsText}>Үйлчилгээний нөхцөлийг зөвшөөрч байна</Text>
              </Pressable>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <PressableScale onPress={() => void sendRequest()} scaleTo={0.98} disabled={!accepted || sending}>
                <LinearGradient
                  colors={accepted ? ["#4F5763", "#30353D"] : ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.06)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <Text style={[styles.primaryText, !accepted && { color: colors.dim }]}>
                    {sending ? "Илгээж байна..." : "Төлбөр төлсөн — хүсэлт илгээх"}
                  </Text>
                  <Icon name="arrowRight" size={16} color={accepted ? colors.white : colors.dim} strokeWidth={2} />
                </LinearGradient>
              </PressableScale>
            </>
          )}

          {loading ? (
            <View style={styles.loadingRow}>
              <View style={styles.pendingDot} />
              <Text style={styles.loadingText}>Төлөв шалгаж байна...</Text>
            </View>
          ) : null}
        </GlassCard>
      </Reveal>
    </Screen>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankLabel}>{label}</Text>
      <Text style={styles.bankValue} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 10, padding: 18 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  heroTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.text, letterSpacing: -0.6, marginTop: 18 },
  heroPrice: { fontFamily: fonts.display, fontSize: 38, color: colors.text, letterSpacing: -1.4, marginTop: 2 },
  heroMeta: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.muted, marginTop: 4 },
  compare: { marginTop: 18, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.03)", padding: 12 },
  compareRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  compareIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: colors.borderSoft },
  compareIconActive: { backgroundColor: `${colors.emerald}14`, borderColor: `${colors.emerald}35` },
  compareLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted },
  compareValue: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 15, color: colors.dim, marginTop: 1 },
  compareDivider: { height: 1, backgroundColor: colors.borderSoft, marginVertical: 8 },
  featureCard: { marginTop: 12, padding: 16, gap: 10 },
  cardEyebrow: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.7, color: colors.dim, marginBottom: 2 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: { width: 22, height: 22, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: `${colors.emerald}14`, borderWidth: 1, borderColor: `${colors.emerald}30` },
  featureText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text, lineHeight: 18 },
  bankCard: { marginTop: 12, padding: 16 },
  bankHead: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 12 },
  bankIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: colors.borderSoft },
  bankTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  bankSub: { fontFamily: fonts.body, fontSize: 10, color: colors.dim, marginTop: 2 },
  bankRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  bankLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.dim },
  bankValue: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.text, textAlign: "right" },
  steps: { marginTop: 16, gap: 12, paddingHorizontal: 4 },
  stepRow: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: colors.borderSoft },
  stepNumText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.lilac },
  stepTitle: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.text },
  stepDesc: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 15, color: colors.dim, marginTop: 2 },
  payCard: { marginTop: 16, padding: 16 },
  payTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  payDesc: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 17, color: colors.muted, marginTop: 6 },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, marginTop: 12 },
  checkbox: { width: 21, height: 21, borderRadius: 7, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: colors.lilac, borderColor: colors.lilac },
  termsText: { flex: 1, fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  errorText: { fontFamily: fonts.body, fontSize: 11, color: colors.rose, marginTop: 8 },
  primaryButton: { height: 50, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.white },
  ghostButton: { height: 48, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.035)" },
  ghostText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted },
  pendingBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: `${colors.amber}35`, backgroundColor: `${colors.amber}10`, marginTop: 12 },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber, marginTop: 5 },
  pendingTitle: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  pendingDesc: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 15, color: colors.muted, marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  statusLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  loadingText: { fontFamily: fonts.body, fontSize: 10.5, color: colors.dim },
  successCard: { marginTop: 10, padding: 20, alignItems: "center" },
  successIcon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: `${colors.emerald}12`, borderWidth: 1, borderColor: `${colors.emerald}30` },
  successTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginTop: 16 },
  successDesc: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: "center", marginTop: 6, marginBottom: 12 },
});
