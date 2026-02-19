/**
 * SkeletonLoader — Reusable shimmer placeholder for loading states
 *
 * Usage:
 *   <SkeletonLoader width={200} height={20} />
 *   <SkeletonLoader width="100%" height={120} borderRadius={18} />
 */

import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing,
} from "react-native-reanimated";
import { useFigmaColors } from "@/lib/figma-colors";

interface SkeletonLoaderProps {
    width: number | `${number}%` | "100%";
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function SkeletonLoader({
    width,
    height,
    borderRadius = 8,
    style,
}: SkeletonLoaderProps) {
    const c = useFigmaColors();
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.ease }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
    }));

    return (
        <View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    overflow: "hidden",
                    backgroundColor: c.isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.04)",
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: c.isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
}

/** Pre-built skeleton layouts */
export function SkeletonServiceCard() {
    return (
        <View style={skeletonStyles.serviceCard}>
            <SkeletonLoader width="100%" height={160} borderRadius={18} />
            <View style={{ padding: 14, gap: 8 }}>
                <SkeletonLoader width="80%" height={16} borderRadius={6} />
                <SkeletonLoader width="50%" height={12} borderRadius={6} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <SkeletonLoader width={60} height={12} borderRadius={6} />
                    <SkeletonLoader width={40} height={12} borderRadius={6} />
                </View>
            </View>
        </View>
    );
}

export function SkeletonChatBubble({ isOwn = false }: { isOwn?: boolean }) {
    return (
        <View
            style={[
                skeletonStyles.chatBubble,
                { alignSelf: isOwn ? "flex-end" : "flex-start" },
            ]}
        >
            <SkeletonLoader width={180} height={14} borderRadius={6} />
            <SkeletonLoader width={120} height={14} borderRadius={6} style={{ marginTop: 4 }} />
        </View>
    );
}

export function SkeletonConversationRow() {
    return (
        <View style={skeletonStyles.conversationRow}>
            <SkeletonLoader width={52} height={52} borderRadius={26} />
            <View style={{ flex: 1, gap: 6 }}>
                <SkeletonLoader width="60%" height={14} borderRadius={6} />
                <SkeletonLoader width="90%" height={12} borderRadius={6} />
            </View>
        </View>
    );
}

const skeletonStyles = StyleSheet.create({
    serviceCard: {
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,
    },
    chatBubble: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        maxWidth: "70%",
    },
    conversationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
});
