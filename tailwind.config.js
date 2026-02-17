/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // BAYSIS Design System Colors (from Figma)
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        "card-foreground": "rgb(var(--color-card-foreground) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--color-muted-foreground) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-foreground": "rgb(var(--color-primary-foreground) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        "secondary-foreground": "rgb(var(--color-secondary-foreground) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--color-accent-foreground) / <alpha-value>)",
        destructive: "rgb(var(--color-destructive) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",

        // Figma accent + semantic (direct use)
        "figma-accent": "#a3ff3f",
        "figma-bg": "#0b0b0f",
        "figma-surface": "#131316",
        "figma-elevated": "#151518",
        "figma-destructive": "#ff6467",
        "figma-warning": "#ff8904",
        "figma-success": "#00c950",
        "figma-info": "#3b82f6",
        "figma-purple": "#a855f7",

        // System Colors (kept for compatibility)
        "ios-red": "#ff6467",
        "ios-red-dark": "#ff6467",
        "ios-green": "#00c950",
        "ios-orange": "#ff8904",
      },
      fontFamily: {
        inter: ["Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        "sf-pro": ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Figma-extracted type scale
        "figma-hero": ["44px", { lineHeight: "48px", letterSpacing: "-0.025em", fontWeight: "900" }],
        "figma-display": ["40px", { lineHeight: "60px", letterSpacing: "-0.025em", fontWeight: "900" }],
        "figma-largetitle": ["36px", { lineHeight: "36px", fontWeight: "900" }],
        "figma-title1": ["28px", { lineHeight: "28px", letterSpacing: "-0.025em", fontWeight: "900" }],
        "figma-title2": ["24px", { lineHeight: "24px", fontWeight: "900" }],
        "figma-title3": ["22px", { lineHeight: "22px", fontWeight: "900" }],
        "figma-headline": ["20px", { lineHeight: "25px", fontWeight: "900" }],
        "figma-subheadline": ["18px", { lineHeight: "27px", fontWeight: "900" }],

        // iOS-compatible type scale (kept for compatibility)
        "ios-largetitle": ["34px", { lineHeight: "41px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "ios-title1": ["28px", { lineHeight: "34px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "ios-title2": ["22px", { lineHeight: "28px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "ios-title3": ["20px", { lineHeight: "25px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "ios-headline": ["17px", { lineHeight: "22px", fontWeight: "600" }],
        "ios-body": ["17px", { lineHeight: "22px", fontWeight: "400" }],
        "ios-callout": ["16px", { lineHeight: "21px", fontWeight: "400" }],
        "ios-subhead": ["15px", { lineHeight: "20px", fontWeight: "400" }],
        "ios-footnote": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "ios-caption1": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "ios-caption2": ["11px", { lineHeight: "13px", fontWeight: "400" }],
      },
      borderRadius: {
        // Figma-extracted radii
        "figma-xs": "8px",
        "figma-sm": "10px",
        "figma-md": "12px",
        "figma-default": "14px",
        "figma-lg": "16px",
        "figma-xl": "18px",
        "figma-2xl": "20px",
        "figma-3xl": "22px",
        "figma-4xl": "24px",
        "figma-pill": "40px",

        // iOS compat
        "ios-sm": "10px",
        "ios-md": "14px",
        "ios-lg": "18px",
        "ios-xl": "20px",
        "ios-2xl": "22px",
        "ios-3xl": "26px",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
        // Thumbnail size
        "thumb": "96px",
      },
      maxWidth: {
        // iPad responsive containers
        "content": "600px",
        "feed": "800px",
      },
      animation: {
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "slide-up": "slide-up 0.15s ease-out",
        "slide-down": "slide-down 0.15s ease-out",
        "fade-in": "fade-in 0.12s ease-out",
        "scale-in": "scale-in 0.12s ease-out",
        "press": "press 0.12s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "press": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(163, 255, 63, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(163, 255, 63, 0.6)" },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    aspectRatio: false,
  },
};
