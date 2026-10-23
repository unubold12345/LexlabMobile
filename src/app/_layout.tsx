import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { AuthProvider } from "@/lib/auth";
import { BankProvider } from "@/lib/bank";
import { ProgressProvider } from "@/lib/progress";
import { LoadingScreen } from "@/components/LoadingScreen";
import { colors } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 350, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hide();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProgressProvider>
          <BankProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="quiz" options={{ animation: "slide_from_bottom" }} />
              <Stack.Screen name="exam-setup" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="saved" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="mistakes" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="custom" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="browse" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="drill" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="plan" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="upgrade" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="result" options={{ animation: "fade" }} />
              <Stack.Screen name="login" options={{ animation: "slide_from_bottom" }} />
            </Stack>
            {!booted ? <LoadingScreen onFinish={() => setBooted(true)} /> : null}
          </BankProvider>
        </ProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
