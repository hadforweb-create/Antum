/**
 * BAYSIS Design System - Premium Marketplace
 */

export const colors = {
    // Primary actions - matte black / white
    primary: "#111111",
    primaryDark: "#FFFFFF",

    // Accent - matte black (no purple)
    accent: "#111111",

    // Backgrounds - warm off-white / dark
    background: "#F5F3EE",
    backgroundDark: "#121210",

    // Cards
    card: "#FFFFFF",
    cardDark: "#1C1C1A",

    // Text
    foreground: "#111111",
    foregroundDark: "#F5F3EE",
    secondary: "#2A2A2A",
    muted: "#8E8E8A",

    // Destructive
    destructive: "#D64040",
    destructiveDark: "#E05050",

    // Borders - warm stone
    border: "#D6D2C8",
    borderDark: "rgba(255,255,255,0.1)",

    // System Colors (kept for compatibility)
    ios: {
        red: "#D64040",
        redDark: "#E05050",
        green: "#34C759",
        orange: "#CC7A00",
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
    sm: 10,
    md: 14,
    lg: 18,
    xl: 20,
    "2xl": 22,
    "3xl": 26,
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
