import { Platform } from "react-native";

// API Configuration
// iOS simulator can use localhost, but physical devices need your computer's IP
const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Default for development
    if (__DEV__) {
        // iOS simulator can access localhost
        if (Platform.OS === "ios") {
            return "http://localhost:3001";
        }
        // Android emulator uses special IP for localhost
        if (Platform.OS === "android") {
            return "http://10.0.2.2:3001";
        }
    }

    // Production URL (update when deployed)
    return "https://api.antum.app";
};

export const API_URL = getBaseUrl();

