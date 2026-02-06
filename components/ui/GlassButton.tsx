import React from "react";
import {
    Pressable,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { useThemeStore } from "@/lib/store";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type GlassButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type GlassButtonSize = "sm" | "md" | "lg";

interface GlassButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    variant?: GlassButtonVariant;
    size?: GlassButtonSize;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
}

export function GlassButton({
    onPress,
    children,
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    style,
}: GlassButtonProps) {
    const { isDark } = useThemeStore();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.98, { duration: 120 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 120 });
    };

    const handlePress = () => {
        if (!disabled && !loading) {
            onPress();
        }
    };

    const getContainerStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            minHeight: 44, // iOS touch target
            opacity: disabled ? 0.5 : 1,
        };

        // Size styles
        const sizeStyles: Record<GlassButtonSize, ViewStyle> = {
            sm: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 36 },
            md: { paddingHorizontal: 20, paddingVertical: 12, minHeight: 44 },
            lg: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 52 },
        };

        // Variant styles
        const variantStyles: Record<GlassButtonVariant, ViewStyle> = {
            primary: {
                backgroundColor: isDark ? "#FFFFFF" : "#000000",
            },
            secondary: {
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
            },
            ghost: {
                backgroundColor: "transparent",
            },
            destructive: {
                backgroundColor: isDark ? "#FF453A" : "#FF3B30",
            },
        };

        return {
            ...baseStyle,
            ...sizeStyles[size],
            ...variantStyles[variant],
            ...(fullWidth && { width: "100%" }),
        };
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
            fontWeight: "600",
            textAlign: "center",
        };

        const sizeStyles: Record<GlassButtonSize, TextStyle> = {
            sm: { fontSize: 14 },
            md: { fontSize: 17 },
            lg: { fontSize: 17 },
        };

        const variantStyles: Record<GlassButtonVariant, TextStyle> = {
            primary: {
                color: isDark ? "#000000" : "#FFFFFF",
            },
            secondary: {
                color: isDark ? "#FFFFFF" : "#000000",
            },
            ghost: {
                color: "#5050F0",
            },
            destructive: {
                color: "#FFFFFF",
            },
        };

        return {
            ...baseStyle,
            ...sizeStyles[size],
            ...variantStyles[variant],
        };
    };

    const content = (
        <>
            {loading ? (
                <ActivityIndicator
                    color={variant === "primary" ? (isDark ? "#000" : "#FFF") : "#5050F0"}
                    size="small"
                />
            ) : (
                <>
                    {icon}
                    <Text style={getTextStyle()}>{children}</Text>
                </>
            )}
        </>
    );

    // Use BlurView for secondary variant
    if (variant === "secondary") {
        return (
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[animatedStyle, { borderRadius: 14, overflow: "hidden" }, fullWidth && { width: "100%" }, style]}
            >
                <BlurView
                    intensity={20}
                    tint={isDark ? "dark" : "light"}
                    style={[getContainerStyle(), styles.blurContainer]}
                >
                    {content}
                </BlurView>
            </AnimatedPressable>
        );
    }

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[animatedStyle, getContainerStyle(), style]}
        >
            {content}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    blurContainer: {
        overflow: "hidden",
    },
});
