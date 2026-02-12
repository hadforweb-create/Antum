import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { WifiOff } from "lucide-react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

/**
 * Non-intrusive banner that appears when device is offline.
 * Should be mounted globally in the root layout.
 */
export function OfflineBanner() {
    const { isConnected, isInternetReachable } = useNetworkStatus();
    const insets = useSafeAreaInsets();

    // Show banner when explicitly offline or internet unreachable
    const isOffline = isConnected === false || isInternetReachable === false;

    if (!isOffline) {
        return null;
    }

    return (
        <Animated.View
            entering={SlideInUp.duration(300)}
            exiting={SlideOutUp.duration(200)}
            style={[styles.container, { paddingTop: insets.top + 8 }]}
        >
            <WifiOff size={16} color="#FFF" strokeWidth={2} />
            <Text style={styles.text}>No internet connection</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#D64040",
        paddingBottom: 12,
        zIndex: 9999,
    },
    text: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "600",
    },
});
