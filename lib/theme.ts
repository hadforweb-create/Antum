/**
 * BAYSIS Design System — Powered by Figma Tokens
 *
 * This theme imports from figma-tokens.ts (auto-generated via `npm run figma:sync`)
 * and provides the same API surface used throughout the app.
 */

import {
    figmaColors,
    figmaTypography,
    figmaRadii,
    figmaShadows,
    figmaGradients,
} from "./figma-tokens";

// ── Colors ──────────────────────────────────────────────────────────

export const colors = {
    // Primary accent — lime green from Figma
    primary: figmaColors.accent,
    primaryDark: figmaColors.accent,

    // Accent
    accent: figmaColors.accent,

    // Backgrounds
    background: "#F5F3EE",
    backgroundDark: figmaColors.background,

    // Surface
    surface: "#ECE8E1",
    surfaceDark: figmaColors.backgroundElevated,

    // Cards
    card: "#FFFFFF",
    cardDark: figmaColors.backgroundElevated,

    // Elevated cards
    cardElevated: "#FAFAF7",
    cardElevatedDark: figmaColors.surface,

    // Text
    foreground: "#111111",
    foregroundDark: "#F5F3EE",
    secondary: "#2A2A2A",
    secondaryDark: figmaColors.foregroundSecondary,
    muted: figmaColors.foregroundMuted,

    // Destructive
    destructive: figmaColors.destructive,
    destructiveDark: figmaColors.destructive,

    // Success
    success: figmaColors.success,
    successDark: figmaColors.success,

    // Warning
    warning: figmaColors.warning,
    warningDark: figmaColors.warning,

    // Info
    info: figmaColors.info,
    infoDark: figmaColors.info,

    // Purple
    purple: figmaColors.purple,

    // Borders
    border: "#D6D2C8",
    borderDark: figmaColors.border,
    borderSubtle: "rgba(0,0,0,0.04)",
    borderSubtleDark: figmaColors.borderSubtle,

    // Overlays
    overlayLight: figmaColors.overlayLight,
    overlayMedium: figmaColors.overlayMedium,
    overlayHeavy: figmaColors.overlayHeavy,

    // System Colors (kept for compatibility)
    ios: {
        red: figmaColors.destructive,
        redDark: figmaColors.destructive,
        green: figmaColors.success,
        orange: figmaColors.warning,
    },
};

// ── Spacing ─────────────────────────────────────────────────────────

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 40,
    "3xl": 48,
};

// ── Border Radii ────────────────────────────────────────────────────

export const radii = {
    xs: figmaRadii.xs,
    sm: figmaRadii.sm,
    md: figmaRadii.md,
    lg: figmaRadii.lg,
    xl: figmaRadii.xl,
    "2xl": figmaRadii["2xl"],
    "3xl": figmaRadii["3xl"],
    full: 9999,
};

// ── Shadows ─────────────────────────────────────────────────────────

export const shadows = {
    sm: figmaShadows.sm,
    md: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    lg: figmaShadows.lg,
    xl: figmaShadows.xl,
    glow: figmaShadows.glow,
    // Upward shadow for sticky bottom bars
    top: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 8,
    },
};

// ── Typography ──────────────────────────────────────────────────────

export const typography = {
    hero: figmaTypography.hero,
    largeTitle: figmaTypography.largeTitle,
    title1: figmaTypography.title1,
    title2: figmaTypography.title2,
    title3: figmaTypography.title3,
    headline: { fontSize: 17, lineHeight: 24, fontWeight: "600" as const },
    body: { fontSize: 17, lineHeight: 26, fontWeight: "400" as const },
    callout: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
    subhead: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
    footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
    caption1: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
    caption2: { fontSize: 11, lineHeight: 14, fontWeight: "400" as const },
};

// ── Gradients ───────────────────────────────────────────────────────

export const gradients = figmaGradients;

// ── Standard component heights for consistency ──────────────────────

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
