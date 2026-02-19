/**
 * useThemeColors — Convenience re-export of useFigmaColors.
 *
 * This provides the exact same API as useFigmaColors from lib/figma-colors.ts.
 * Screens can import from either location. New screens should prefer this hook.
 */

export { useFigmaColors as useThemeColors } from "@/lib/figma-colors";
