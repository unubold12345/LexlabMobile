import React from "react";
import Svg, { Circle, Path, Rect, Line } from "react-native-svg";
import { colors } from "@/lib/theme";

export type IconName =
  | "home"
  | "grid"
  | "target"
  | "user"
  | "search"
  | "flame"
  | "bolt"
  | "clock"
  | "check"
  | "x"
  | "chevronRight"
  | "chevronLeft"
  | "close"
  | "bookmark"
  | "settings"
  | "bell"
  | "shield"
  | "award"
  | "trending"
  | "sparkles"
  | "refresh"
  | "play"
  | "arrowRight"
  | "arrowLeft"
  | "book"
  | "scale"
  | "filter"
  | "plus"
  | "calendar"
  | "moon"
  | "trophy"
  | "lock"
  | "edit"
  | "eye"
  | "layers"
  | "phone"
  | "logout";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function shapes(name: IconName, color: string, sw: number) {
  const common = { stroke: color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (name) {
    case "home":
      return (
        <>
          <Path d="M3.5 10.6 12 3.8l8.5 6.8" {...common} />
          <Path d="M5.6 9.6V20h12.8V9.6" {...common} />
          <Path d="M9.8 20v-5.4h4.4V20" {...common} />
        </>
      );
    case "grid":
      return (
        <>
          <Rect x="3.5" y="3.5" width="7" height="7" rx="2.2" {...common} />
          <Rect x="13.5" y="3.5" width="7" height="7" rx="2.2" {...common} />
          <Rect x="3.5" y="13.5" width="7" height="7" rx="2.2" {...common} />
          <Rect x="13.5" y="13.5" width="7" height="7" rx="2.2" {...common} />
        </>
      );
    case "target":
      return (
        <>
          <Circle cx="12" cy="12" r="8.2" {...common} />
          <Circle cx="12" cy="12" r="4.4" {...common} />
          <Circle cx="12" cy="12" r="1.1" fill={color} stroke="none" />
        </>
      );
    case "user":
      return (
        <>
          <Circle cx="12" cy="8" r="3.6" {...common} />
          <Path d="M4.8 20.2c.7-3.4 3.6-5.2 7.2-5.2s6.5 1.8 7.2 5.2" {...common} />
        </>
      );
    case "search":
      return (
        <>
          <Circle cx="11" cy="11" r="6.4" {...common} />
          <Line x1="15.7" y1="15.7" x2="20.2" y2="20.2" {...common} />
        </>
      );
    case "flame":
      return (
        <Path
          d="M12.2 3.2c.4 2.5 1.6 3.9 3.2 5.3 1.9 1.7 3.1 3.4 3.1 5.9A6.6 6.6 0 0 1 12 21a6.6 6.6 0 0 1-6.5-6.6c0-2.4 1.2-4.2 3-6 .4 1 .9 1.7 1.7 2.3.6-2.9 1-5.6 2-7.5Z"
          {...common}
        />
      );
    case "bolt":
      return <Path d="M13.4 2.5 4.8 13.7h5.6L9.9 21.5l8.9-11.6h-5.7l.3-7.4Z" {...common} />;
    case "clock":
      return (
        <>
          <Circle cx="12" cy="12" r="8.2" {...common} />
          <Path d="M12 7.6V12l3 2" {...common} />
        </>
      );
    case "check":
      return <Path d="m4.6 12.4 4.8 4.8L19.6 6.8" {...common} />;
    case "x":
      return (
        <>
          <Line x1="6.2" y1="6.2" x2="17.8" y2="17.8" {...common} />
          <Line x1="17.8" y1="6.2" x2="6.2" y2="17.8" {...common} />
        </>
      );
    case "chevronRight":
      return <Path d="m9.2 5.8 6 6.2-6 6.2" {...common} />;
    case "chevronLeft":
      return <Path d="m14.8 5.8-6 6.2 6 6.2" {...common} />;
    case "close":
      return (
        <>
          <Line x1="5.8" y1="5.8" x2="18.2" y2="18.2" {...common} />
          <Line x1="18.2" y1="5.8" x2="5.8" y2="18.2" {...common} />
        </>
      );
    case "bookmark":
      return <Path d="M6.2 3.8h11.6v16.4L12 16.4l-5.8 3.8V3.8Z" {...common} />;
    case "settings":
      return (
        <>
          <Circle cx="12" cy="12" r="3.1" {...common} />
          <Path d="M19.2 12c0 .5 0 .9-.1 1.3l2 1.5-2 3.4-2.3-.9c-.7.6-1.5 1.1-2.4 1.4L14 21.4h-4l-.4-2.7c-.9-.3-1.7-.8-2.4-1.4l-2.3.9-2-3.4 2-1.5c-.1-.4-.1-.8-.1-1.3s0-.9.1-1.3l-2-1.5 2-3.4 2.3.9c.7-.6 1.5-1.1 2.4-1.4L10 2.6h4l.4 2.7c.9.3 1.7.8 2.4 1.4l2.3-.9 2 3.4-2 1.5c.1.4.1.8.1 1.3Z" {...common} />
        </>
      );
    case "bell":
      return (
        <>
          <Path d="M6 9.8a6 6 0 0 1 12 0c0 4 1.2 5.4 1.9 6.1.3.3.1.9-.4.9H4.5c-.5 0-.7-.6-.4-.9C4.8 15.2 6 13.8 6 9.8Z" {...common} />
          <Path d="M10 20a2.2 2.2 0 0 0 4 0" {...common} />
        </>
      );
    case "shield":
      return <Path d="M12 2.8 4.8 6v5.2c0 4.6 3 8.4 7.2 10 4.2-1.6 7.2-5.4 7.2-10V6L12 2.8Z" {...common} />;
    case "award":
      return (
        <>
          <Circle cx="12" cy="9" r="5.4" {...common} />
          <Path d="m8.4 13.7-1.2 7 4.8-2.6 4.8 2.6-1.2-7" {...common} />
        </>
      );
    case "trending":
      return (
        <>
          <Path d="m3.5 16.8 5.6-5.6 3.8 3.8 7.6-7.6" {...common} />
          <Path d="M15.4 7.4h5.1v5.1" {...common} />
        </>
      );
    case "sparkles":
      return (
        <>
          <Path d="M12 3.6c.5 3.3 1.9 4.7 5.2 5.2-3.3.5-4.7 1.9-5.2 5.2-.5-3.3-1.9-4.7-5.2-5.2 3.3-.5 4.7-1.9 5.2-5.2Z" {...common} />
          <Path d="M18.6 14.2c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8Z" {...common} />
        </>
      );
    case "refresh":
      return (
        <>
          <Path d="M20 11.6a8 8 0 0 0-13.7-5.2L3.9 8.7" {...common} />
          <Path d="M4 4.2v4.5h4.5" {...common} />
          <Path d="M4 12.4a8 8 0 0 0 13.7 5.2l2.4-2.3" {...common} />
          <Path d="M20 19.8v-4.5h-4.5" {...common} />
        </>
      );
    case "play":
      return <Path d="M8.2 5.4 18.6 12 8.2 18.6V5.4Z" {...common} />;
    case "arrowRight":
      return (
        <>
          <Line x1="4.4" y1="12" x2="19.2" y2="12" {...common} />
          <Path d="m13.6 6.2 6 5.8-6 5.8" {...common} />
        </>
      );
    case "arrowLeft":
      return (
        <>
          <Line x1="19.6" y1="12" x2="4.8" y2="12" {...common} />
          <Path d="m10.4 6.2-6 5.8 6 5.8" {...common} />
        </>
      );
    case "book":
      return (
        <>
          <Path d="M4.2 5.4c2.8-1.1 5.4-1.1 7.8.2 2.4-1.3 5-1.3 7.8-.2v13.2c-2.8-1-5.4-1-7.8.3-2.4-1.3-5-1.3-7.8-.3V5.4Z" {...common} />
          <Line x1="12" y1="5.9" x2="12" y2="18.6" {...common} />
        </>
      );
    case "scale":
      return (
        <>
          <Line x1="12" y1="3.6" x2="12" y2="19.4" {...common} />
          <Line x1="7.6" y1="19.6" x2="16.4" y2="19.6" {...common} />
          <Line x1="4.2" y1="7.4" x2="19.8" y2="7.4" {...common} />
          <Path d="M6.6 7.4 4 13a3.2 3.2 0 0 0 5.2 0L6.6 7.4Z" {...common} />
          <Path d="M17.4 7.4 14.8 13a3.2 3.2 0 0 0 5.2 0l-2.6-5.6Z" {...common} />
        </>
      );
    case "filter":
      return (
        <>
          <Line x1="3.8" y1="6.4" x2="20.2" y2="6.4" {...common} />
          <Line x1="6.8" y1="12" x2="17.2" y2="12" {...common} />
          <Line x1="10" y1="17.6" x2="14" y2="17.6" {...common} />
        </>
      );
    case "plus":
      return (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...common} />
          <Line x1="5" y1="12" x2="19" y2="12" {...common} />
        </>
      );
    case "calendar":
      return (
        <>
          <Rect x="3.6" y="5.2" width="16.8" height="15" rx="3.2" {...common} />
          <Line x1="3.6" y1="9.8" x2="20.4" y2="9.8" {...common} />
          <Line x1="8" y1="3.2" x2="8" y2="6.8" {...common} />
          <Line x1="16" y1="3.2" x2="16" y2="6.8" {...common} />
        </>
      );
    case "moon":
      return <Path d="M20 14.6A8.4 8.4 0 1 1 9.4 4a7 7 0 0 0 10.6 10.6Z" {...common} />;
    case "trophy":
      return (
        <>
          <Path d="M8 4.4h8v5.2a4 4 0 0 1-8 0V4.4Z" {...common} />
          <Path d="M8 5.6H4.8v1.8A3.4 3.4 0 0 0 8.2 10.8M16 5.6h3.2v1.8a3.4 3.4 0 0 1-3.4 3.4" {...common} />
          <Line x1="12" y1="13.6" x2="12" y2="17.4" {...common} />
          <Line x1="8.6" y1="20.2" x2="15.4" y2="20.2" {...common} />
          <Path d="M9.4 17.4h5.2l.8 2.8H8.6l.8-2.8Z" {...common} />
        </>
      );
    case "lock":
      return (
        <>
          <Rect x="4.8" y="10.4" width="14.4" height="10.2" rx="3" {...common} />
          <Path d="M8 10.4V8a4 4 0 0 1 8 0v2.4" {...common} />
        </>
      );
    case "edit":
      return (
        <>
          <Path d="M4.4 19.6h4l10.2-10.2-4-4L4.4 15.6v4Z" {...common} />
          <Line x1="12.8" y1="7.2" x2="16.8" y2="11.2" {...common} />
        </>
      );
    case "eye":
      return (
        <>
          <Path d="M2.8 12S5.8 5.8 12 5.8 21.2 12 21.2 12 18.2 18.2 12 18.2 2.8 12 2.8 12Z" {...common} />
          <Circle cx="12" cy="12" r="2.8" {...common} />
        </>
      );
    case "layers":
      return (
        <>
          <Path d="m12 3.4 8.4 4.6L12 12.6 3.6 8 12 3.4Z" {...common} />
          <Path d="m4.4 12.4 7.6 4.2 7.6-4.2" {...common} />
          <Path d="m4.4 16.6 7.6 4.2 7.6-4.2" {...common} />
        </>
      );
    case "phone":
      return (
        <Path
          d="M7.2 3.8h2.3l1.2 3.4-1.7 1.3a12.4 12.4 0 0 0 5.8 5.8l1.3-1.7 3.4 1.2v2.3a2 2 0 0 1-2.2 2A15.6 15.6 0 0 1 5.2 6a2 2 0 0 1 2-2.2Z"
          {...common}
        />
      );
    case "logout":
      return (
        <>
          <Path d="M13.4 4.2H6.8a2 2 0 0 0-2 2v11.6a2 2 0 0 0 2 2h6.6" {...common} />
          <Path d="M15.4 8.2 19.4 12l-4 3.8M10 12h9.2" {...common} />
        </>
      );
    default:
      return null;
  }
}

export function Icon({ name, size = 22, color = colors.text, strokeWidth = 1.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {shapes(name, color, strokeWidth)}
    </Svg>
  );
}

export default Icon;
