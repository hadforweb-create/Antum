/**
 * BAYSIS Design System - Premium Marketplace
 * Warm minimal + glass aesthetic
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

    // Surface - softer stone for sections / inputs
    surface: "#ECE8E1",
    surfaceDark: "#1A1A18",

    // Cards
    card: "#FFFFFF",
    cardDark: "#1C1C1A",

    // Elevated cards - slightly lifted from card
    cardElevated: "#FAFAF7",
    cardElevatedDark: "#242422",

    // Text
    foreground: "#111111",
    foregroundDark: "#F5F3EE",
    secondary: "#2A2A2A",
    secondaryDark: "#C8C6C0",
    muted: "#8E8E8A",

    // Destructive
    destructive: "#D64040",
    destructiveDark: "#E05050",

    // Success
    success: "#34C759",
    successDark: "#30D158",

    // Borders - warm stone
    border: "#D6D2C8",
    borderDark: "rgba(255,255,255,0.08)",
    borderSubtle: "rgba(0,0,0,0.04)",
    borderSubtleDark: "rgba(255,255,255,0.05)",

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
    "2xl": 40,
    "3xl": 48,
};

export const radii = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 22,
    "2xl": 24,
    "3xl": 28,
    full: 9999,
};

// Soft premium shadows - warm, diffuse, never harsh
export const shadows = {
    sm: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    md: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    lg: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 6,
    },
    xl: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 8,
    },
    // Upward shadow for sticky bottom bars
    top: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 8,
    },
};

export const typography = {
    hero: { fontSize: 42, lineHeight: 48, fontWeight: "800" as const, letterSpacing: -1 },
    largeTitle: { fontSize: 36, lineHeight: 44, fontWeight: "700" as const, letterSpacing: -0.5 },
    title1: { fontSize: 30, lineHeight: 38, fontWeight: "700" as const, letterSpacing: -0.3 },
    title2: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const, letterSpacing: -0.2 },
    title3: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const, letterSpacing: -0.1 },
    headline: { fontSize: 17, lineHeight: 24, fontWeight: "600" as const },
    body: { fontSize: 17, lineHeight: 26, fontWeight: "400" as const },
    callout: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
    subhead: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
    footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
    caption1: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
    caption2: { fontSize: 11, lineHeight: 14, fontWeight: "400" as const },
};

// Standard component heights for consistency
export const componentSizes = {
    buttonSm: 42,
    buttonMd: 52,
    buttonLg: 58,
    inputHeight: 58,
    avatarSm: 36,
    avatarMd: 48,
    avatarLg: 88,
    iconButton: 46,
    tabBar: 88,
};
