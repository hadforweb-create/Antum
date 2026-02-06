import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useThemeStore } from "@/lib/store";
import { GlassButton } from "./GlassButton";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
}

export function EmptyState({
    icon,
    title,
    subtitle,
    actionLabel,
    onAction,
    style,
}: EmptyStateProps) {
    const { isDark } = useThemeStore();

    return (
        <View style={[styles.container, style]}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
                style={[
                    styles.title,
                    { color: isDark ? "#FFFFFF" : "#000000" },
                ]}
            >
                {title}
            </Text>
            {subtitle && (
                <Text
                    style={[
                        styles.subtitle,
                        { color: isDark ? "#8E8E93" : "#8E8E93" },
                    ]}
                >
                    {subtitle}
                </Text>
            )}
            {actionLabel && onAction && (
                <GlassButton
                    onPress={onAction}
                    variant="secondary"
                    size="sm"
                    style={styles.action}
                >
                    {actionLabel}
                </GlassButton>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    iconContainer: {
        marginBottom: 16,
        opacity: 0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 20,
        maxWidth: 280,
    },
    action: {
        marginTop: 24,
    },
});
