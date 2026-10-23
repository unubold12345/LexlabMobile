export const colors = {
  bg: "#08090B",
  bgSoft: "#0E1013",
  card: "rgba(255,255,255,0.045)",
  cardStrong: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.09)",
  borderSoft: "rgba(255,255,255,0.055)",
  text: "#F3F4F6",
  muted: "#A3A7AE",
  dim: "#70747C",
  indigo: "#4B5563",
  indigoDeep: "#374151",
  violet: "#8B919B",
  lilac: "#CDD2DA",
  pink: "#B4B9C1",
  emerald: "#34D399",
  emeraldDeep: "#059669",
  rose: "#FB7185",
  roseDeep: "#E11D48",
  amber: "#B9BDC4",
  white: "#FFFFFF",
} as const;

export const fonts = {
  display: "Manrope_800ExtraBold",
  displayMedium: "Manrope_600SemiBold",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemi: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
  bodyExtra: "Manrope_800ExtraBold",
} as const;

export const radii = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
} as const;

export const gradients = {
  brand: ["#565E6B", "#363C46", "#272B32"] as const,
  brandSoft: ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.03)"] as const,
  success: ["#10B981", "#34D399"] as const,
  danger: ["#E11D48", "#FB7185"] as const,
  gold: ["#9CA3AF", "#D4D4D8"] as const,
} as const;

export const actionGradient = ["#4F5763", "#30353D"] as const;
