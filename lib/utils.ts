import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from "date-fns";
import type { ActivityCategory, CategoryConfig } from "@/types";

// ============================================
// DATE UTILITIES
// ============================================

export function formatActivityDate(date: Date): string {
  if (isToday(date)) {
    return `Today, ${format(date, "h:mm a")}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, "h:mm a")}`;
  }
  if (isThisWeek(date)) {
    return format(date, "EEEE, h:mm a");
  }
  return format(date, "EEE, MMM d");
}

export function formatShortDate(date: Date): string {
  return format(date, "EEE, MMM d");
}

export function formatTime(time: string): string {
  // Convert 24h to 12h format
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

// ============================================
// CATEGORY CONFIGURATION
// ============================================

export const CATEGORIES: CategoryConfig[] = [
  {
    name: "Outdoors",
    icon: "mountain",
    color: "#34C759",
    lightBg: "#E8F9ED",
    darkBg: "#1A3D1F",
  },
  {
    name: "Social",
    icon: "users",
    color: "#007AFF",
    lightBg: "#E5F1FF",
    darkBg: "#1A2E4A",
  },
  {
    name: "Music",
    icon: "music",
    color: "#AF52DE",
    lightBg: "#F5E8FF",
    darkBg: "#2D1A4A",
  },
  {
    name: "Wellness",
    icon: "heart",
    color: "#FF2D55",
    lightBg: "#FFE5EB",
    darkBg: "#4A1A25",
  },
  {
    name: "Food & Drink",
    icon: "utensils",
    color: "#FF9500",
    lightBg: "#FFF3E5",
    darkBg: "#4A2D1A",
  },
  {
    name: "Sports",
    icon: "trophy",
    color: "#30D158",
    lightBg: "#E8FAF0",
    darkBg: "#1A4A28",
  },
  {
    name: "Culture",
    icon: "palette",
    color: "#5856D6",
    lightBg: "#EEEEFF",
    darkBg: "#1F1F4A",
  },
  {
    name: "Learning",
    icon: "book-open",
    color: "#64D2FF",
    lightBg: "#E5F8FF",
    darkBg: "#1A3D4A",
  },
];

export function getCategoryConfig(category: ActivityCategory): CategoryConfig {
  return CATEGORIES.find((c) => c.name === category) || CATEGORIES[0];
}

export function getCategoryIcon(category: ActivityCategory): string {
  return getCategoryConfig(category).icon;
}

export function getCategoryColor(category: ActivityCategory): string {
  return getCategoryConfig(category).color;
}

// ============================================
// STRING UTILITIES
// ============================================

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + "s"}`;
}

export function formatAttendees(current: number, max: number): string {
  return `${current}/${max}`;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUsername(username: string): boolean {
  // 3-20 chars, letters, numbers, underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters
  return password.length >= 8;
}

// ============================================
// IMAGE UTILITIES
// ============================================

export function getImageDimensions(
  aspectRatio: "16:10" | "4:3" | "1:1" | "9:16",
  width: number
): { width: number; height: number } {
  const ratios: Record<string, number> = {
    "16:10": 10 / 16,
    "4:3": 3 / 4,
    "1:1": 1,
    "9:16": 16 / 9,
  };
  return {
    width,
    height: Math.round(width * ratios[aspectRatio]),
  };
}

// ============================================
// HAPTIC UTILITIES
// ============================================

export const HapticPatterns = {
  light: "light" as const,
  medium: "medium" as const,
  heavy: "heavy" as const,
  success: "notificationSuccess" as const,
  warning: "notificationWarning" as const,
  error: "notificationError" as const,
};

// ============================================
// ERROR UTILITIES
// ============================================

export function getFirebaseErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/operation-not-allowed": "This operation is not allowed.",
    "auth/weak-password": "Password should be at least 8 characters.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your connection.",
  };
  
  return errorMessages[code] || "An error occurred. Please try again.";
}

// ============================================
// GLASSMORPHISM STYLES
// ============================================

export const glassStyles = {
  ultraThin: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    // Note: blur is handled by expo-blur component
  },
  thin: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  regular: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  thick: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  ultraThick: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
};

export const glassStylesDark = {
  ultraThin: {
    backgroundColor: "rgba(28, 28, 30, 0.4)",
  },
  thin: {
    backgroundColor: "rgba(28, 28, 30, 0.6)",
  },
  regular: {
    backgroundColor: "rgba(28, 28, 30, 0.75)",
  },
  thick: {
    backgroundColor: "rgba(28, 28, 30, 0.88)",
  },
  ultraThick: {
    backgroundColor: "rgba(28, 28, 30, 0.94)",
  },
};

// ============================================
// PLATFORM UTILITIES
// ============================================

import { Platform, Dimensions } from "react-native";

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// iPhone models with notch/dynamic island
export const hasNotch = (): boolean => {
  if (!isIOS) return false;
  const { height, width } = Dimensions.get("window");
  // iPhone X and later have height >= 812
  return (
    (height >= 812 && width >= 375) ||
    (height >= 896 && width >= 414)
  );
};
