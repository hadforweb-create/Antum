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
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            minHeight: 48,
            opacity: disabled ? 0.5 : 1,
        };

        // Size styles
        const sizeStyles: Record<GlassButtonSize, ViewStyle> = {
            sm: { paddingHorizontal: 18, paddingVertical: 10, minHeight: 40 },
            md: { paddingHorizontal: 24, paddingVertical: 14, minHeight: 48 },
            lg: { paddingHorizontal: 28, paddingVertical: 18, minHeight: 56 },
        };

        // Variant styles
        const variantStyles: Record<GlassButtonVariant, ViewStyle> = {
            primary: {
                backgroundColor: isDark ? "#F5F3EE" : "#111111",
            },
            secondary: {
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "#D6D2C8",
            },
            ghost: {
                backgroundColor: "transparent",
            },
            destructive: {
                backgroundColor: isDark ? "#E05050" : "#D64040",
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
                color: isDark ? "#111111" : "#FFFFFF",
            },
            secondary: {
                color: isDark ? "#F5F3EE" : "#2A2A2A",
            },
            ghost: {
                color: isDark ? "#F5F3EE" : "#111111",
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
                    color={variant === "primary" ? (isDark ? "#111" : "#FFF") : (isDark ? "#F5F3EE" : "#111111")}
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
                style={[animatedStyle, { borderRadius: 20, overflow: "hidden" }, fullWidth && { width: "100%" }, style]}
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
