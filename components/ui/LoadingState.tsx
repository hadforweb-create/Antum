import React from "react";
import {
    View,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    Text,
    DimensionValue,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
} from "react-native-reanimated";
import { useThemeStore } from "@/lib/store";

interface LoadingStateProps {
    message?: string;
    size?: "small" | "large";
    style?: ViewStyle;
}

export function LoadingState({
    message,
    size = "large",
    style,
}: LoadingStateProps) {
    const { isDark } = useThemeStore();

    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator
                size={size}
                color={isDark ? "#F5F3EE" : "#111111"}
            />
            {message && (
                <Text
                    style={[
                        styles.message,
                        { color: "#8E8E8A" },
                    ]}
                >
                    {message}
                </Text>
            )}
        </View>
    );
}

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({
    width = "100%",
    height = 20,
    borderRadius = 8,
    style,
}: SkeletonProps) {
    const { isDark } = useThemeStore();
    const opacity = useSharedValue(0.3);

    React.useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: width as DimensionValue,
                    height,
                    borderRadius,
                    backgroundColor: isDark ? "#2A2A2A" : "#E8E6E1",
                },
                animatedStyle,
                style,
            ]}
        />
    );
}

interface SkeletonCardProps {
    style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
    const { isDark } = useThemeStore();

    return (
        <View
            style={[
                styles.skeletonCard,
                {
                    backgroundColor: isDark ? "#1C1C1A" : "#FFFFFF",
                    borderColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(214, 210, 200, 0.6)",
                },
                style,
            ]}
        >
            <Skeleton height={96} borderRadius={12} style={styles.skeletonThumb} />
            <View style={styles.skeletonContent}>
                <Skeleton width="70%" height={18} style={styles.skeletonRow} />
                <Skeleton width="50%" height={14} style={styles.skeletonRow} />
                <Skeleton width="40%" height={14} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    message: {
        fontSize: 15,
        marginTop: 16,
    },
    skeletonCard: {
        flexDirection: "row",
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    skeletonThumb: {
        width: 96,
        marginRight: 16,
    },
    skeletonContent: {
        flex: 1,
        justifyContent: "center",
    },
    skeletonRow: {
        marginBottom: 8,
    },
});
