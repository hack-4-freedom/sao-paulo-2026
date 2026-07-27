export const tokens = {
  color: {
    bg: "#0B0E11",
    bgElevated: "#14181D",
    surface: "#1A1F26",
    surface2: "#222831",
    surface3: "#2B323C",
    border: "#2A3038",
    borderStrong: "#3A424D",
    fg: "#F5F7FA",
    fgMuted: "#A0A8B4",
    fgSubtle: "#6B7280",
    fgDisabled: "#4B5563",
    primary: "#F7931A",
    primaryHover: "#FFA733",
    primaryPress: "#E07D0A",
    primaryFg: "#0B0E11",
    secondary: "#10B981",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    "2xl": 36,
  },
  duration: {
    fast: 160,
    base: 240,
    slow: 360,
  },
  ease: {
    spring: [0.34, 1.56, 0.64, 1] as const,
    outSoft: [0.22, 1, 0.36, 1] as const,
  },
} as const;

export type Token = typeof tokens;
