import React from "react";
import { View, StyleSheet, ViewStyle, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ContainerProps {
    children: React.ReactNode;
    maxWidth?: "content" | "feed" | "full";
    style?: ViewStyle;
    padded?: boolean;
    safeArea?: boolean;
}

const MAX_WIDTHS = {
    content: 600,
    feed: 800,
    full: 9999,
};

/**
 * Responsive container that centers content on iPad
 * and provides consistent padding across devices.
 */
export function Container({
    children,
    maxWidth = "feed",
    style,
    padded = true,
    safeArea = false,
}: ContainerProps) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const isTablet = width >= 768;
    const containerMaxWidth = MAX_WIDTHS[maxWidth];

    return (
        <View
            style={[
                styles.container,
                {
                    paddingHorizontal: padded ? (isTablet ? 32 : 24) : 0,
                    paddingTop: safeArea ? insets.top : 0,
                    paddingBottom: safeArea ? insets.bottom : 0,
                },
                style,
            ]}
        >
            <View
                style={[
                    styles.content,
                    {
                        maxWidth: containerMaxWidth,
                        width: "100%",
                    },
                ]}
            >
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
    },
    content: {
        flex: 1,
    },
});
