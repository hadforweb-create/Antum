import React, { useState } from "react";
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { useThemeStore } from "@/lib/store";

interface GlassInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export function GlassInput({
    label,
    error,
    containerStyle,
    style,
    ...props
}: GlassInputProps) {
    const { isDark } = useThemeStore();
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
        ? isDark
            ? "#FF453A"
            : "#FF3B30"
        : isFocused
            ? "#5050F0"
            : isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.04)";

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text
                    style={[
                        styles.label,
                        { color: isDark ? "#8E8E93" : "#3C3C43" },
                    ]}
                >
                    {label}
                </Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        borderColor,
                        borderWidth: isFocused || error ? 2 : 1,
                    },
                ]}
            >
                <BlurView
                    intensity={isDark ? 40 : 20}
                    tint={isDark ? "dark" : "light"}
                    style={StyleSheet.absoluteFill}
                />
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: isDark
                                ? "rgba(28, 28, 30, 0.7)"
                                : "rgba(255, 255, 255, 0.7)",
                        },
                    ]}
                />
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: isDark ? "#FFFFFF" : "#000000",
                        },
                        style,
                    ]}
                    placeholderTextColor={isDark ? "#8E8E93" : "#8E8E93"}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    {...props}
                />
            </View>
            {error && (
                <Text
                    style={[
                        styles.error,
                        { color: isDark ? "#FF453A" : "#FF3B30" },
                    ]}
                >
                    {error}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        borderRadius: 18,
        overflow: "hidden",
        minHeight: 52,
    },
    input: {
        flex: 1,
        fontSize: 17,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 52,
    },
    error: {
        fontSize: 13,
        marginTop: 6,
        marginLeft: 4,
    },
});
