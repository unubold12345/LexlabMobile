import { useWindowDimensions } from "react-native";

export const TABLET_MIN_SIZE = 600;
export const LARGE_TABLET_MIN_SIZE = 834;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const shortest = Math.min(width, height);
  const isTablet = shortest >= TABLET_MIN_SIZE;
  const isLargeTablet = shortest >= LARGE_TABLET_MIN_SIZE || width >= 1180;
  const isLandscape = width > height;
  const gutter = isLargeTablet ? 40 : isTablet ? 28 : 20;
  const maxContentWidth = isLargeTablet ? 1180 : isTablet ? 940 : width;
  const columns = isLargeTablet ? 4 : isTablet ? 3 : 1;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    isLandscape,
    gutter,
    maxContentWidth,
    columns,
  };
}
