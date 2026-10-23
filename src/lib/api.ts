import Constants from "expo-constants";
import { Platform } from "react-native";

function devApiBase(): string | null {
  if (!__DEV__) return null;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:3000`;
  }
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:3000` : null;
}

export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ||
  devApiBase() ||
  "https://lawtest-rho.vercel.app"
).replace(/\/$/, "");

export function apiUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
