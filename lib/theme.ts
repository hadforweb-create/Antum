/**
 * ANTUM Design System - Theme Colors
 */

export const colors = {
    // Primary actions - black/white
    primary: "#000000",
    primaryDark: "#FFFFFF",

    // Accent - purple
    accent: "#5050F0",

    // Backgrounds
    background: "#FAFAFC",
    backgroundDark: "#121214",

    // Cards
    card: "#FFFFFF",
    cardDark: "#1C1C1E",

    // Text
    foreground: "#000000",
    foregroundDark: "#FFFFFF",
    muted: "#8E8E93",

    // Destructive
    destructive: "#FF3B30",
    destructiveDark: "#FF453A",

    // Borders
    border: "rgba(0,0,0,0.04)",
    borderDark: "rgba(255,255,255,0.08)",

    // iOS System Colors
    ios: {
        red: "#FF3B30",
        redDark: "#FF453A",
        blue: "#007AFF",
        green: "#34C759",
        orange: "#FF9500",
        yellow: "#FFCC00",
        purple: "#AF52DE",
        pink: "#FF2D55",
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const radii = {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 18,
    "2xl": 20,
    "3xl": 24,
    full: 9999,
};

export const typography = {
    largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700" as const },
    title1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
    title2: { fontSize: 22, lineHeight: 28, fontWeight: "600" as const },
    title3: { fontSize: 20, lineHeight: 25, fontWeight: "600" as const },
    headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
    body: { fontSize: 17, lineHeight: 22, fontWeight: "400" as const },
    callout: { fontSize: 16, lineHeight: 21, fontWeight: "400" as const },
    subhead: { fontSize: 15, lineHeight: 20, fontWeight: "400" as const },
    footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
    caption1: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
    caption2: { fontSize: 11, lineHeight: 13, fontWeight: "400" as const },
};
