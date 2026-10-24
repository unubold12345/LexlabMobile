import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TextInputInstance } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/LogoMark";
import { PressableScale, Reveal } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { useResponsive } from "@/lib/responsive";
import { colors, fonts, radii } from "@/lib/theme";

export default function Login() {
  const auth = useAuth();
  const { isTablet } = useResponsive();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"phone" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/profile");
  };

  const submit = async () => {
    if (auth.signingIn) return;
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.length < 8) {
      setError("Утасны дугаараа бүрэн оруулна уу.");
      return;
    }
    if (password.length < 6) {
      setError("Нууц үг дор хаяж 6 тэмдэгт байна.");
      return;
    }
    setError(null);
    try {
      await auth.signIn(cleanPhone, password);
      close();
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (/fetch|network|abort/i.test(message)) {
        setError("Серверт холбогдож чадсангүй. Интернэт холболтоо шалгана уу.");
      } else {
        setError(message || "Нэвтрэх боломжгүй. Дахин оролдоно уу.");
      }
    }
  };

  const openWeb = async (path: string) => {
    try {
      await Linking.openURL(`${API_BASE}${path}`);
    } catch {
      setError("Хөтөч нээх боломжгүй байна.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <Screen contentStyle={styles.content}>
        <View style={[styles.formColumn, isTablet && styles.formColumnTablet]}>
          <View style={styles.topBar}>
          <PressableScale onPress={close} scaleTo={0.9} style={styles.closeButton}>
            <View style={styles.closeInner}>
              <Icon name="close" size={17} color={colors.muted} />
            </View>
          </PressableScale>
          <View style={styles.securePill}>
            <Icon name="shield" size={11} color={colors.emerald} />
            <Text style={styles.secureText}>АЮУЛГҮЙ НЭВТРЭЛТ</Text>
          </View>
        </View>

        <Reveal delay={40}>
          <View style={[styles.hero, isTablet && styles.heroTablet]}>
            <LogoMark size={58} />
            <Text style={styles.kicker}>LEXLAB ACCOUNT</Text>
            <Text style={[styles.title, isTablet && styles.titleTablet]}>Суралцах замаа{"\n"}үргэлжлүүлээрэй.</Text>
            <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
              Нэвтэрснээр бүх асуулт, явц, алдааны түүх таны бүх төхөөрөмж дээр хадгалагдана.
            </Text>
          </View>
        </Reveal>

        <Reveal delay={110}>
          <View style={styles.benefits}>
            <Benefit icon="layers" text="Бүх 4,588 асуулт" />
            <Benefit icon="trending" text="Явц синхрон" />
            <Benefit icon="target" text="Алдаа давтах" />
          </View>
        </Reveal>

        <Reveal delay={170}>
          <View style={[styles.formCard, isTablet && styles.formCardTablet]}>
            <View pointerEvents="none" style={styles.sheen} />

            <Text style={styles.label}>УТАСНЫ ДУГААР</Text>
            <View style={[styles.field, focused === "phone" && styles.fieldFocused]}>
              <Icon name="phone" size={17} color={focused === "phone" ? colors.lilac : colors.dim} />
              <TextInput
                value={phone}
                onChangeText={(v) => {
                  setPhone(v);
                  if (error) setError(null);
                }}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused(null)}
                placeholder="8800 1234"
                placeholderTextColor={colors.dim}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={styles.input}
                selectionColor={colors.violet}
                maxLength={20}
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>НУУЦ ҮГ</Text>
            <View style={[styles.field, focused === "password" && styles.fieldFocused]}>
              <Icon name="lock" size={17} color={focused === "password" ? colors.lilac : colors.dim} />
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (error) setError(null);
                }}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                placeholderTextColor={colors.dim}
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={submit}
                style={styles.input}
                selectionColor={colors.violet}
                maxLength={200}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12} style={styles.eye}>
                <Icon name="eye" size={17} color={showPassword ? colors.lilac : colors.dim} />
              </Pressable>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Icon name="x" size={13} color={colors.rose} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <PressableScale onPress={submit} disabled={auth.signingIn} scaleTo={0.975} style={{ marginTop: 22 }}>
              <LinearGradient
                colors={["#4F5763", "#30353D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submit}
              >
                {auth.signingIn ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitText}>Нэвтрэх</Text>
                    <Icon name="arrowRight" size={18} color={colors.white} strokeWidth={2} />
                  </>
                )}
              </LinearGradient>
            </PressableScale>

            <Pressable onPress={() => openWeb("/login")} hitSlop={8} style={styles.forgot}>
              <Text style={styles.forgotText}>Нууц үг мартсан?</Text>
            </Pressable>
          </View>
        </Reveal>

        <Reveal delay={230}>
          <View style={styles.guestBlock}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>эсвэл</Text>
              <View style={styles.dividerLine} />
            </View>
            <PressableScale onPress={close} scaleTo={0.98}>
              <View style={styles.guestButton}>
                <Icon name="user" size={16} color={colors.muted} />
                <Text style={styles.guestText}>Зочноор үргэлжлүүлэх</Text>
              </View>
            </PressableScale>
            <Pressable onPress={() => openWeb("/login")} hitSlop={8} style={styles.signup}>
              <Text style={styles.signupText}>
                Бүртгэл байхгүй юу? <Text style={styles.signupLink}>Бүртгүүлэх</Text>
              </Text>
            </Pressable>
          </View>
        </Reveal>

        <Text style={styles.footer}>
          Үргэлжлүүлснээр та Lexlab-ийн үйлчилгээний нөхцөл болон нууцлалын журмыг хүлээн зөвшөөрнө.
        </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Benefit({ icon, text }: { icon: "layers" | "trending" | "target"; text: string }) {
  return (
    <View style={styles.benefit}>
      <Icon name={icon} size={13} color={colors.lilac} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 48 },
  formColumn: { width: "100%", maxWidth: 520, alignSelf: "center" },
  formColumnTablet: { maxWidth: 620 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  closeButton: {},
  closeInner: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  securePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(52,211,153,0.08)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.2)",
  },
  secureText: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.1, color: colors.emerald },
  hero: { alignItems: "center", marginTop: 34 },
  heroTablet: { marginTop: 48 },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 2.4,
    color: colors.lilac,
    marginTop: 20,
    opacity: 0.85,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 29,
    lineHeight: 37,
    letterSpacing: -0.9,
    color: colors.text,
    textAlign: "center",
    marginTop: 11,
  },
  titleTablet: { fontSize: 34, lineHeight: 43 },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12.8,
    lineHeight: 19,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 300,
    marginTop: 10,
  },
  subtitleTablet: { fontSize: 14, lineHeight: 21, maxWidth: 420 },
  benefits: { flexDirection: "row", justifyContent: "center", gap: 7, marginTop: 22, flexWrap: "wrap" },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  benefitText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted },
  formCard: {
    marginTop: 26,
    padding: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  formCardTablet: { padding: 26, marginTop: 32 },
  sheen: {
    position: "absolute",
    top: 0,
    left: 22,
    right: 22,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1.6, color: colors.dim, marginBottom: 8 },
  field: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 11,
  },
  fieldFocused: { borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.045)" },
  input: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.text, padding: 0 },
  eye: { padding: 3 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "rgba(225,29,72,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.2)",
  },
  errorText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.rose, lineHeight: 16 },
  submit: {
    height: 56,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  submitText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.white, letterSpacing: 0.2 },
  forgot: { alignSelf: "center", marginTop: 16, padding: 4 },
  forgotText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.dim },
  guestBlock: { marginTop: 26 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  dividerText: { fontFamily: fonts.body, fontSize: 10, color: colors.dim, textTransform: "lowercase" },
  guestButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  guestText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  signup: { alignSelf: "center", marginTop: 18, padding: 4 },
  signupText: { fontFamily: fonts.body, fontSize: 12, color: colors.dim },
  signupLink: { fontFamily: fonts.bodyBold, color: colors.lilac },
  footer: {
    fontFamily: fonts.body,
    fontSize: 9.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    maxWidth: 300,
    alignSelf: "center",
    marginTop: 30,
  },
});
