import React, { Component, ErrorInfo, ReactNode } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RefreshCw, AlertTriangle } from "lucide-react-native";
import { useThemeStore } from "@/lib/store";
import { GlobalToast } from "@/components/ui/GlobalToast";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import * as Sentry from "@sentry/react-native";
import "../global.css";

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  debug: __DEV__,
});

// Error Boundary with improved UI
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log in development
    if (__DEV__) {
      console.error("App Error:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <AlertTriangle size={48} color="#FF3B30" strokeWidth={1.5} />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {__DEV__
              ? this.state.error?.message || "Unknown error"
              : "We're having trouble loading the app. Please try again."
            }
          </Text>
          <Pressable style={styles.retryButton} onPress={this.handleRetry}>
            <RefreshCw size={18} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

// ROOT LAYOUT - PURE WRAPPER ONLY
// NO useEffect, NO useRouter, NO auth logic, NO navigation
export default function RootLayout() {
  const { isDark } = useThemeStore();

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: isDark ? "#000" : "#F2F2F7" }}>
            <Slot />
            <GlobalToast />
            <OfflineBanner />
            <StatusBar style={isDark ? "light" : "dark"} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#121214",
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#5050F0",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
