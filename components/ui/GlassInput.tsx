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
            : "transparent";

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text
                    style={[
                        styles.label,
                        { color: isDark ? "#C8C6C0" : "#2A2A2A" },
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
                        borderWidth: isFocused || error ? 2 : 0,
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
        marginBottom: 22,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 10,
        marginLeft: 4,
        letterSpacing: 0.1,
    },
    inputContainer: {
        borderRadius: 22,
        overflow: "hidden",
        minHeight: 58,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 17,
        paddingHorizontal: 20,
        paddingVertical: 17,
        minHeight: 58,
    },
    error: {
        fontSize: 13,
        marginTop: 8,
        marginLeft: 4,
    },
});
