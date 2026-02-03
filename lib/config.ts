import { Platform } from "react-native";

// API Configuration
// Backend runs on port 4001, API paths include /api prefix

const getBaseUrl = () => {
    // Use environment variable if set (production builds)
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
    }

    // Development only - never hardcode localhost in production
    if (__DEV__) {
        // iOS simulator can access localhost/127.0.0.1
        if (Platform.OS === "ios") {
            return "http://127.0.0.1:4001";
        }
        // Android emulator uses special IP for localhost
        if (Platform.OS === "android") {
            return "http://10.0.2.2:4001";
        }
        // Web
        return "http://localhost:4001";
    }

    // Production URL - MUST be set via EXPO_PUBLIC_API_URL
    // Fallback throws error to prevent accidental localhost in production
    throw new Error(
        "EXPO_PUBLIC_API_URL not set. Please configure your production API URL."
    );
};

export const API_URL = getBaseUrl();

// Log the API URL at startup (dev only)
if (__DEV__) {
    console.log("[Config] API_URL:", API_URL);
}

// App configuration
export const APP_CONFIG = {
    // Request timeout in ms
    requestTimeout: 12000,
    // Pagination defaults
    defaultPageSize: 10,
    // Feature flags
    features: {
        activities: true,
        reels: true,
        services: true,
        messaging: true,
    },
} as const;
