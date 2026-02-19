/**
 * BAYSIS Figma Design Colors Hook — Premium Freelance Marketplace UI
 *
 * Design: Dark-first, #0b0b0f bg, #131316 surface, #a3ff3f accent
 */

import { useThemeStore } from "@/lib/store";

export function useFigmaColors() {
    const { isDark } = useThemeStore();

    // Premium dark palette from Figma Make file
    const dark = {
        bg: "#0b0b0f",
        surface: "#131316",
        elevated: "#1a1a1e",
        cardBg: "rgba(19,19,22,0.95)",

        text: "#FFFFFF",
        textSecondary: "rgba(255,255,255,0.7)",
        textMuted: "rgba(255,255,255,0.5)",
        textSubtle: "rgba(255,255,255,0.3)",

        accent: "#a3ff3f",
        accentDark: "#84cc16",
        accentSubtle: "rgba(163,255,63,0.1)",
        accentGlow: "rgba(163,255,63,0.25)",

        primaryBtnBg: "#a3ff3f",
        primaryBtnText: "#0b0b0f",
        secondaryBtnBg: "rgba(255,255,255,0.08)",

        inputBg: "rgba(255,255,255,0.06)",
        inputBorder: "rgba(255,255,255,0.1)",

        border: "rgba(255,255,255,0.08)",
        borderSubtle: "rgba(255,255,255,0.04)",

        destructive: "#E05050",
        success: "#22c55e",
        warning: "#f59e0b",
        info: "#3b82f6",
        purple: "#a855f7",

        tabBarBg: "rgba(11,11,15,0.95)",
        tabActive: "#a3ff3f",
        tabInactive: "rgba(255,255,255,0.35)",

        overlayLight: "rgba(255,255,255,0.04)",
        overlayMedium: "rgba(255,255,255,0.1)",
        overlayDark: "rgba(0,0,0,0.5)",
    };

    // Light mode keeps same structure, different values
    const light = {
        bg: "#F5F3EE",
        surface: "#FFFFFF",
        elevated: "#FAFAF7",
        cardBg: "rgba(255,255,255,0.95)",

        text: "#111111",
        textSecondary: "#2A2A2A",
        textMuted: "#8E8E8A",
        textSubtle: "#AEAEAE",

        accent: "#84cc16",
        accentDark: "#65a30d",
        accentSubtle: "rgba(132,204,22,0.1)",
        accentGlow: "rgba(132,204,22,0.2)",

        primaryBtnBg: "#111111",
        primaryBtnText: "#FFFFFF",
        secondaryBtnBg: "rgba(0,0,0,0.05)",

        inputBg: "rgba(0,0,0,0.04)",
        inputBorder: "rgba(0,0,0,0.08)",

        border: "rgba(0,0,0,0.08)",
        borderSubtle: "rgba(0,0,0,0.04)",

        destructive: "#D64040",
        success: "#16a34a",
        warning: "#d97706",
        info: "#2563eb",
        purple: "#9333ea",

        tabBarBg: "rgba(245,243,238,0.95)",
        tabActive: "#111111",
        tabInactive: "#8E8E8A",

        overlayLight: "rgba(0,0,0,0.04)",
        overlayMedium: "rgba(0,0,0,0.08)",
        overlayDark: "rgba(0,0,0,0.4)",
    };

    const c = isDark ? dark : light;
    return { ...c, isDark } as const;
}
