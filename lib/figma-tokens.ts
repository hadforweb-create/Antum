/**
 * Auto-generated from Figma — BAYSIS LAST DESIGN
 * Generated: 2026-02-17T22:55:40.206Z
 * File ID: 6DJl6TjKsqDOA49z3A8vBv
 *
 * DO NOT EDIT MANUALLY — run `npm run figma:sync` to regenerate
 */

// ── Semantic Colors ──────────────────────────────────────────────────
export const figmaColors = {
  accent: "#a3ff3f",
  background: "#0b0b0f",
  backgroundElevated: "#131316",
  surface: "#151518",
  foreground: "#ffffff",
  foregroundSecondary: "rgba(255, 255, 255, 0.7)",
  foregroundMuted: "rgba(255, 255, 255, 0.5)",
  foregroundSubtle: "rgba(255, 255, 255, 0.4)",
  destructive: "#ff6467",
  warning: "#ff8904",
  success: "#00c950",
  info: "#3b82f6",
  purple: "#a855f7",
  border: "rgba(255, 255, 255, 0.1)",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  borderStrong: "rgba(255, 255, 255, 0.2)",
  overlayLight: "rgba(255, 255, 255, 0.04)",
  overlayMedium: "rgba(255, 255, 255, 0.1)",
  overlayHeavy: "rgba(255, 255, 255, 0.2)",
} as const;

// ── Typography Scale ─────────────────────────────────────────────────
export const figmaTypography = {
  hero: {
    fontSize: 44,
    lineHeight: 48.4,
    fontWeight: "900" as const,
    letterSpacing: -1.1,
  },
  display: {
    fontSize: 40,
    lineHeight: 60,
    fontWeight: "900" as const,
    letterSpacing: -1,
  },
  largeTitle: {
    fontSize: 36,
    lineHeight: 36,
    fontWeight: "900" as const,
  },
  title1: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "900" as const,
    letterSpacing: -0.7,
  },
  title2: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "900" as const,
  },
  title3: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "900" as const,
  },
  headline: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900" as const,
  },
  subheadline: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "900" as const,
  },
  body: {
    fontSize: 17,
    lineHeight: 25.5,
    fontWeight: "700" as const,
  },
  callout: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: "900" as const,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: "900" as const,
  },
  footnote: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "900" as const,
  },
  caption1: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: "900" as const,
  },
  caption2: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "900" as const,
  },
  small: {
    fontSize: 11,
    lineHeight: 16.5,
    fontWeight: "900" as const,
  },
  tiny: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "900" as const,
  },
  micro: {
    fontSize: 9,
    lineHeight: 13.5,
    fontWeight: "900" as const,
  },
} as const;

// ── Border Radii ────────────────────────────────────────────────────
export const figmaRadii = {
  "xs": 8,
  "sm": 10,
  "md": 12,
  "DEFAULT": 14,
  "lg": 16,
  "xl": 18,
  "2xl": 20,
  "3xl": 22,
  "4xl": 24,
  "pill": 28,
  "jumbo": 40,
  full: 9999,
} as const;

// ── Font Families ───────────────────────────────────────────────────
export const figmaFonts = ["Inter"] as const;

// ── Gradients ───────────────────────────────────────────────────────
export const figmaGradients = {
  accentPrimary: ["#84cc16", "#65a30d", "#4d7c0f"],
  accentSecondary: ["#f97316", "#ea580c", "#c2410c"],
  accentTertiary: ["#84cc16", "#4d7c0f"],
  purple: ["#84cc16", "#65a30d"],
  orange: ["#a3ff3f", "#65a30d"],
  warmDark: ["#1a2a0e", "#0f1a08"],
} as const;

// ── Shadows (React Native) ───────────────────────────────────────────
export const figmaShadows = {
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#a3ff3f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  xl: {
    shadowColor: "#84cc16",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
  },
  glow: {
    shadowColor: "#a3ff3f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

// ── Raw Color Palette (reference) ───────────────────────────────────
export const figmaRawPalette = [
  { hex: "#ffffff", usageCount: 717 },
  { hex: "#a3ff3f", usageCount: 191 },
  { hex: "#131316", usageCount: 102 },
  { hex: "#000000", usageCount: 48 },
  { hex: "#0b0b0f", usageCount: 24 },
  { hex: "#ff8904", usageCount: 13 },
  { hex: "#ff6467", usageCount: 12 },
  { hex: "#a855f7", usageCount: 10 },
  { hex: "#51a2ff", usageCount: 10 },
  { hex: "#151518", usageCount: 7 },
  { hex: "#fdc700", usageCount: 5 },
  { hex: "#0b0b0d", usageCount: 4 },
  { hex: "#0a0a0a", usageCount: 4 },
  { hex: "#2b7fff", usageCount: 4 },
  { hex: "#ff6900", usageCount: 4 },
  { hex: "#c27aff", usageCount: 4 },
  { hex: "#84cc16", usageCount: 3 },
  { hex: "#3b82f6", usageCount: 3 },
  { hex: "#ad46ff", usageCount: 2 },
  { hex: "#f97316", usageCount: 2 },
] as const;
