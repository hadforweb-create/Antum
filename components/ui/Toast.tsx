import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    runOnJS,
} from "react-native-reanimated";
import { Check, X, AlertCircle } from "lucide-react-native";

interface ToastProps {
    visible: boolean;
    message: string;
    type?: "success" | "error" | "info";
    duration?: number;
    onHide: () => void;
}

export function Toast({
    visible,
    message,
    type = "success",
    duration = 3000,
    onHide,
}: ToastProps) {
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            translateY.value = withTiming(0, { duration: 300 });
            opacity.value = withTiming(1, { duration: 300 });

            const timer = setTimeout(() => {
                translateY.value = withTiming(-100, { duration: 300 });
                opacity.value = withTiming(0, { duration: 300 }, () => {
                    runOnJS(onHide)();
                });
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const getColors = () => {
        switch (type) {
            case "success":
                return { bg: "rgba(52, 199, 89, 0.95)", icon: Check };
            case "error":
                return { bg: "rgba(255, 59, 48, 0.95)", icon: X };
            case "info":
            default:
                return { bg: "rgba(80, 80, 240, 0.95)", icon: AlertCircle };
        }
    };

    const { bg, icon: Icon } = getColors();

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <Pressable onPress={onHide}>
                <View style={[styles.toast, { backgroundColor: bg }]}>
                    <Icon size={20} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.message}>{message}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: "center",
    },
    toast: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    message: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "600",
        flex: 1,
    },
});
