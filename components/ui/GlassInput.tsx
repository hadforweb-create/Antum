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
            ? "#E05050"
            : "#D64040"
        : isFocused
            ? isDark ? "#F5F3EE" : "#111111"
            : isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "#D6D2C8";

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text
                    style={[
                        styles.label,
                        { color: isDark ? "#8E8E8A" : "#2A2A2A" },
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
                                ? "rgba(28, 28, 26, 0.7)"
                                : "rgba(255, 255, 255, 0.7)",
                        },
                    ]}
                />
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: isDark ? "#F5F3EE" : "#111111",
                        },
                        style,
                    ]}
                    placeholderTextColor="#8E8E8A"
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
                        { color: isDark ? "#E05050" : "#D64040" },
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
        borderRadius: 20,
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
